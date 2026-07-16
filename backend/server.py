"""
AYESHA'S PRIVATE UNIVERSE — FastAPI backend.

Handles the private gateway (date-based access), session cookies,
progress tracking, memories seed/API, story reading position, and
final-reveal unlock persistence.
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import os
import re
import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Any, Optional

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, Depends, FastAPI, HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Env + Mongo
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
db_name = os.environ["DB_NAME"]

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
# The relationship date. Normalised form we compare against.
# Kept as an env var so we don't ship the answer in the JS bundle.
GATEWAY_NORMALISED_ANSWER = os.environ.get("GATEWAY_ANSWER", "20250917")
SESSION_SECRET = os.environ.get(
    "SESSION_SECRET", "please-set-a-real-secret-in-production"
)
SESSION_COOKIE = "apu_session"
SESSION_TTL_DAYS = 60

# Rate-limiter (simple in-memory)
_gateway_attempts: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW_SECONDS = 60 * 15
RATE_LIMIT_MAX_ATTEMPTS = 12

# ---------------------------------------------------------------------------
# Pydantic helpers (BSON friendly)
# ---------------------------------------------------------------------------
def _validate_object_id(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        return v
    raise TypeError("Invalid ObjectId")


PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


class BaseDoc(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def normalise_date_input(raw: str) -> Optional[str]:
    """
    Accept spec-defined variants, return YYYYMMDD.
    Anything unparseable returns None.
    """
    if not raw:
        return None
    text = raw.strip().lower()
    text = re.sub(r"\s+", " ", text)

    # Purely numeric: 17092025, 20250917
    digits = re.sub(r"\D", "", text)
    if len(digits) == 8:
        # Try DDMMYYYY
        try:
            dt = datetime.strptime(digits, "%d%m%Y")
            return dt.strftime("%Y%m%d")
        except ValueError:
            pass
        # Try YYYYMMDD
        try:
            dt = datetime.strptime(digits, "%Y%m%d")
            return dt.strftime("%Y%m%d")
        except ValueError:
            pass

    # Slash / dash separated
    for pattern in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y/%m/%d"):
        try:
            dt = datetime.strptime(text, pattern)
            return dt.strftime("%Y%m%d")
        except ValueError:
            continue

    # Ordinal-friendly word format: 17 september 2025, 17th september 2025
    cleaned = re.sub(r"(\d+)(st|nd|rd|th)", r"\1", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    for pattern in ("%d %B %Y", "%d %b %Y", "%B %d %Y", "%b %d %Y"):
        try:
            dt = datetime.strptime(cleaned, pattern)
            return dt.strftime("%Y%m%d")
        except ValueError:
            continue

    return None


def check_gateway(raw: str) -> bool:
    """Constant-time compare against configured answer."""
    normalised = normalise_date_input(raw)
    if not normalised:
        return False
    return hmac.compare_digest(normalised, GATEWAY_NORMALISED_ANSWER)


def make_session_token(profile_id: str) -> str:
    """Signed session token — {rand}.{sig}."""
    rand = secrets.token_urlsafe(24)
    payload = f"{profile_id}.{rand}"
    sig = hmac.new(SESSION_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def verify_session_token(token: str) -> Optional[str]:
    """Return profile_id if signature valid, else None."""
    if not token:
        return None
    try:
        profile_id, rand, sig = token.rsplit(".", 2)
    except ValueError:
        return None
    payload = f"{profile_id}.{rand}"
    expected = hmac.new(
        SESSION_SECRET.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, sig):
        return None
    return profile_id


def touch_rate_limit(ip: str) -> bool:
    """Return False if the caller is rate limited."""
    now = time.time()
    attempts = _gateway_attempts[ip]
    # prune
    _gateway_attempts[ip] = [t for t in attempts if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(_gateway_attempts[ip]) >= RATE_LIMIT_MAX_ATTEMPTS:
        return False
    _gateway_attempts[ip].append(now)
    return True


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ---------------------------------------------------------------------------
# FastAPI
# ---------------------------------------------------------------------------
app = FastAPI(title="Ayesha's Private Universe")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("apu")


# ---------------------------------------------------------------------------
# Session dependency
# ---------------------------------------------------------------------------
async def get_session(request: Request) -> dict:
    token = request.cookies.get(SESSION_COOKIE)
    profile_id = verify_session_token(token or "")
    if not profile_id:
        raise HTTPException(status_code=401, detail="Session expired or missing")

    sess = await db.private_sessions.find_one({"profile_id": profile_id, "token": token})
    if not sess:
        raise HTTPException(status_code=401, detail="Session not found")
    expires_at = sess.get("expires_at")
    if expires_at:
        try:
            expires_dt = datetime.fromisoformat(expires_at)
            if expires_dt < now_utc():
                raise HTTPException(status_code=401, detail="Session expired")
        except ValueError:
            pass
    await db.private_sessions.update_one(
        {"_id": sess["_id"]}, {"$set": {"last_seen_at": now_utc().isoformat()}}
    )
    return {"profile_id": profile_id, "session": sess}


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class GatewayIn(BaseModel):
    answer: str


class GatewayOut(BaseModel):
    ok: bool
    message: str


class ProgressIn(BaseModel):
    section_key: str


class UnlockIn(BaseModel):
    unlocked: bool = True


class StoryPositionIn(BaseModel):
    section_index: int = 0
    scroll_ratio: float = 0.0


class MemoryFavoriteIn(BaseModel):
    favourite: bool


# ---------------------------------------------------------------------------
# Seed memories (used on startup if collection empty)
# ---------------------------------------------------------------------------
SEED_MEMORIES = [
    {
        "slug": "sep-17-the-match",
        "title": "The Match",
        "short_caption": "Where the universe agreed we would meet.",
        "body": (
            "September 17, 2025. An ordinary Wednesday. A profile. A conversation. "
            "A small decision to reply. It did not look like the beginning of "
            "something important yet — most beginnings rarely do."
        ),
        "annotation": "Long-press the little bow. Three seconds. Trust me.",
        "memory_date": "2025-09-17",
        "date_precision": "day",
        "category": "our_firsts",
        "tags": ["hinge", "beginning", "wednesday"],
        "cover_asset": {
            "asset_id": "MEM-SEP17-COVER",
            "type": "photograph",
            "orientation": "landscape",
            "resolution": "2400 × 1600 px",
            "aspect": "3:2",
            "content_needed": "Abstract September-toned still — window light, warm walls, one hand on a phone. No faces required.",
            "filename": "mem-sep17-cover.webp",
        },
        "hidden_bow": True,
        "published": True,
        "sort_index": 1,
    },
    {
        "slug": "sep-25-first-meeting",
        "title": "The First Time You Were Real",
        "short_caption": "The elevator did not respect the performance.",
        "body": (
            "September 25 was the first time the person inside my phone became "
            "real in front of me. I wanted to look confident. Then I placed my "
            "hand between closing lift doors like a film scene. The doors "
            "disagreed. My hand was crushed. My dignity followed shortly after."
        ),
        "annotation": "Attempted confidence: 100%. Successful confidence: 4%.",
        "memory_date": "2025-09-25",
        "date_precision": "day",
        "category": "our_firsts",
        "tags": ["first meeting", "cravery", "lift incident"],
        "cover_asset": {
            "asset_id": "MEM-SEP25-COVER",
            "type": "photograph",
            "orientation": "portrait",
            "resolution": "1600 × 2000 px",
            "aspect": "4:5",
            "content_needed": "Cravery interior, elevator lobby, or a candid moment from the first meeting.",
            "filename": "mem-sep25-first-meeting.webp",
        },
        "published": True,
        "sort_index": 2,
    },
    {
        "slug": "oct-11-first-kiss",
        "title": "The First Kiss",
        "short_caption": "The space between us felt different.",
        "body": (
            "October 11. Some memories remain clear because of where they "
            "happened. Others remain because of how they changed everything "
            "around them. This one changed the geometry of us."
        ),
        "annotation": "Later became a detective-game password. Romance requires authentication.",
        "memory_date": "2025-10-11",
        "date_precision": "day",
        "category": "our_firsts",
        "tags": ["first kiss", "october", "quiet turning points"],
        "cover_asset": {
            "asset_id": "MEM-OCT11-COVER",
            "type": "photograph",
            "orientation": "landscape",
            "resolution": "2000 × 1333 px",
            "aspect": "3:2",
            "content_needed": "Blurred lights, close-up textures, or a soft romantic photo from around Oct 11.",
            "filename": "mem-oct11-first-kiss.webp",
        },
        "published": True,
        "sort_index": 3,
    },
    {
        "slug": "dec-12-the-promise",
        "title": "The Question Became A Promise",
        "short_caption": "The moment I stopped leaving my feelings unnamed.",
        "body": (
            "December 12, 2025. I asked you to make us official. It was not "
            "the beginning of my feelings — it was the moment I stopped leaving "
            "them unnamed. I wanted you to know I was not simply passing "
            "through your life. I was choosing to stay."
        ),
        "annotation": "You said yes without pretending to think about it.",
        "memory_date": "2025-12-12",
        "date_precision": "day",
        "category": "our_firsts",
        "tags": ["proposal", "ring", "promise"],
        "cover_asset": {
            "asset_id": "MEM-DEC12-COVER",
            "type": "photograph",
            "orientation": "portrait",
            "resolution": "1600 × 2000 px",
            "aspect": "4:5",
            "content_needed": "Ring close-up, hand shot, or a favourite photo from December 12.",
            "filename": "mem-dec12-promise.webp",
        },
        "published": True,
        "sort_index": 4,
    },
    {
        "slug": "chat-therapy",
        "title": "Chat Therapy",
        "short_caption": "We chose repair over pride.",
        "body": (
            "Our first real fight taught us that affection alone cannot solve "
            "everything. We overthought. We defended ourselves. Then, in the "
            "most modern relationship solution possible, we asked ChatGPT to "
            "translate our feelings. It was funny from the outside. What "
            "mattered was: we stayed."
        ),
        "memory_date": "2025-11-15",
        "date_precision": "approximate",
        "category": "things_only_we_understand",
        "tags": ["fight", "repair", "gpt"],
        "cover_asset": {
            "asset_id": "MEM-CHAT-THERAPY",
            "type": "illustration",
            "orientation": "landscape",
            "resolution": "1800 × 1200 px",
            "aspect": "3:2",
            "content_needed": "Abstract chat-screen composition or a warm reconciliation photo.",
            "filename": "mem-chat-therapy.webp",
        },
        "published": True,
        "sort_index": 5,
    },
    {
        "slug": "pungun-cassette",
        "title": "Pungun",
        "short_caption": "A family word that should never have become a song.",
        "body": (
            "A word from your family that was never meant to leave the house. "
            "Somehow, you turned it into a song. Somehow, I sing it now."
        ),
        "memory_date": "2025-11-01",
        "date_precision": "approximate",
        "category": "things_only_we_understand",
        "tags": ["pungun", "chaos", "vocabulary"],
        "cover_asset": {
            "asset_id": "MEM-PUNGUN",
            "type": "illustration",
            "orientation": "square",
            "resolution": "1400 × 1400 px",
            "aspect": "1:1",
            "content_needed": "Comic sticker or the silliest couple photo you have.",
            "filename": "mem-pungun.webp",
        },
        "published": True,
        "sort_index": 6,
    },
    {
        "slug": "feb-14-ayesha-birthday",
        "title": "Your Day, and Ours",
        "short_caption": "The world calls it Valentine's. I call it your birthday.",
        "body": (
            "February 14 already belonged to the world. But it belongs to me "
            "differently, because it also belongs to you. It gave me an excuse "
            "to celebrate two things at once: the person I love, and the fact "
            "that she exists at all."
        ),
        "memory_date": "2026-02-14",
        "date_precision": "day",
        "category": "months",
        "tags": ["birthday", "valentine", "tulips"],
        "cover_asset": {
            "asset_id": "MEM-FEB14-COVER",
            "type": "photograph",
            "orientation": "portrait",
            "resolution": "1600 × 2000 px",
            "aspect": "4:5",
            "content_needed": "Ayesha's birthday hero, celebration, or gift close-up.",
            "filename": "mem-feb14-birthday.webp",
        },
        "published": True,
        "sort_index": 7,
    },
    {
        "slug": "ordinary-days",
        "title": "The Days Nobody Photographed",
        "short_caption": "Waiting for replies. Asking if you ate.",
        "body": (
            "Relationships are not made only from proposals, birthdays and "
            "first kisses. They are also made from ordinary calls. Waiting "
            "for replies. Missing each other without turning it into a "
            "performance. Most of us will never appear in a gallery. But "
            "those ordinary parts are often the ones that make everything "
            "else feel real."
        ),
        "memory_date": "2026-01-10",
        "date_precision": "approximate",
        "category": "photos",
        "tags": ["ordinary", "calls", "candid"],
        "cover_asset": {
            "asset_id": "MEM-ORDINARY-01",
            "type": "photograph",
            "orientation": "landscape",
            "resolution": "2000 × 1333 px",
            "aspect": "3:2",
            "content_needed": "A random candid — long drive, video call screenshot, café table.",
            "filename": "mem-ordinary-01.webp",
        },
        "published": True,
        "sort_index": 8,
    },
]


async def ensure_seed() -> None:
    count = await db.memories.count_documents({})
    if count == 0:
        docs = []
        for m in SEED_MEMORIES:
            doc = dict(m)
            doc["created_at"] = now_utc().isoformat()
            doc["updated_at"] = now_utc().isoformat()
            docs.append(doc)
        await db.memories.insert_many(docs)
        log.info("Seeded %d memories", len(docs))


# ---------------------------------------------------------------------------
# Serializers
# ---------------------------------------------------------------------------
def memory_to_public(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id")),
        "slug": doc.get("slug"),
        "title": doc.get("title"),
        "short_caption": doc.get("short_caption"),
        "body": doc.get("body"),
        "annotation": doc.get("annotation"),
        "memory_date": doc.get("memory_date"),
        "date_precision": doc.get("date_precision"),
        "category": doc.get("category"),
        "tags": doc.get("tags", []),
        "cover_asset": doc.get("cover_asset"),
        "hidden_bow": doc.get("hidden_bow", False),
        "favourite": doc.get("favourite", False),
        "sort_index": doc.get("sort_index", 0),
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"message": "Private Archive 1709 — online."}


@api.get("/config")
async def config_endpoint():
    """Public configuration — never exposes secret answer."""
    return {
        "app_name": "Ayesha's Private Universe",
        "app_short": "Ayeshi",
        "audio_source": os.environ.get(
            "OUR_SONG_URL",
            # Royalty-free ambient placeholder (Bensound-lounge alternative)
            "",
        ),
        "audio_title": os.environ.get("OUR_SONG_TITLE", "Ambient placeholder"),
    }


@api.post("/auth/gateway", response_model=GatewayOut)
async def auth_gateway(payload: GatewayIn, request: Request, response: Response):
    ip = client_ip(request)
    if not touch_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    if not check_gateway(payload.answer):
        return GatewayOut(ok=False, message="wrong-date")

    profile_id = "ayesha"  # single-user experience
    token = make_session_token(profile_id)
    expires = now_utc() + timedelta(days=SESSION_TTL_DAYS)

    await db.private_sessions.insert_one(
        {
            "profile_id": profile_id,
            "token": token,
            "created_at": now_utc().isoformat(),
            "last_seen_at": now_utc().isoformat(),
            "expires_at": expires.isoformat(),
            "ip": ip,
        }
    )
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=SESSION_TTL_DAYS * 24 * 3600,
        path="/",
    )
    return GatewayOut(ok=True, message="welcome-home")


@api.post("/auth/logout")
async def auth_logout(response: Response, session: dict = Depends(get_session)):
    token = session["session"].get("token")
    await db.private_sessions.delete_one({"token": token})
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@api.get("/auth/me")
async def auth_me(session: dict = Depends(get_session)):
    return {"profile_id": session["profile_id"]}


# ---------------------------- Progress ----------------------------
@api.get("/progress")
async def get_progress(session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    doc = await db.progress.find_one({"profile_id": profile_id})
    if not doc:
        return {
            "sections_explored": [],
            "story_position": {"section_index": 0, "scroll_ratio": 0.0},
            "hidden_scroll_eligible": False,
            "hidden_scroll_found": False,
            "final_reveal_unlocked": False,
            "final_reveal_viewed": False,
            "favourite_memory_ids": [],
        }
    doc.pop("_id", None)
    doc.pop("profile_id", None)
    return doc


@api.post("/progress/section")
async def track_section(payload: ProgressIn, session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    doc = await db.progress.find_one({"profile_id": profile_id}) or {}
    explored = set(doc.get("sections_explored", []))
    explored.add(payload.section_key)
    hidden_eligible = len(explored) >= 4

    new_doc = {
        "profile_id": profile_id,
        "sections_explored": sorted(explored),
        "story_position": doc.get("story_position", {"section_index": 0, "scroll_ratio": 0.0}),
        "hidden_scroll_eligible": hidden_eligible,
        "hidden_scroll_found": doc.get("hidden_scroll_found", False),
        "final_reveal_unlocked": doc.get("final_reveal_unlocked", False),
        "final_reveal_viewed": doc.get("final_reveal_viewed", False),
        "favourite_memory_ids": doc.get("favourite_memory_ids", []),
        "updated_at": now_utc().isoformat(),
    }
    await db.progress.update_one(
        {"profile_id": profile_id}, {"$set": new_doc}, upsert=True
    )
    return {
        "sections_explored": new_doc["sections_explored"],
        "hidden_scroll_eligible": hidden_eligible,
    }


@api.post("/progress/story-position")
async def save_story_position(payload: StoryPositionIn, session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    await db.progress.update_one(
        {"profile_id": profile_id},
        {
            "$set": {
                "story_position": {
                    "section_index": payload.section_index,
                    "scroll_ratio": payload.scroll_ratio,
                },
                "updated_at": now_utc().isoformat(),
            }
        },
        upsert=True,
    )
    return {"ok": True}


@api.post("/progress/hidden-scroll")
async def unlock_hidden_scroll(session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    doc = await db.progress.find_one({"profile_id": profile_id}) or {}
    if not doc.get("hidden_scroll_eligible"):
        raise HTTPException(status_code=403, detail="not-yet-eligible")
    await db.progress.update_one(
        {"profile_id": profile_id},
        {
            "$set": {
                "hidden_scroll_found": True,
                "final_reveal_unlocked": True,
                "updated_at": now_utc().isoformat(),
            }
        },
        upsert=True,
    )
    return {"ok": True, "final_reveal_unlocked": True}


@api.post("/progress/final-viewed")
async def mark_final_viewed(session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    doc = await db.progress.find_one({"profile_id": profile_id}) or {}
    if not doc.get("final_reveal_unlocked"):
        raise HTTPException(status_code=403, detail="not-unlocked")
    await db.progress.update_one(
        {"profile_id": profile_id},
        {"$set": {"final_reveal_viewed": True, "updated_at": now_utc().isoformat()}},
        upsert=True,
    )
    return {"ok": True}


# ---------------------------- Memories ----------------------------
@api.get("/memories")
async def list_memories(session: dict = Depends(get_session)):
    docs = await db.memories.find({"published": True}).sort("sort_index", 1).to_list(500)
    progress_doc = await db.progress.find_one({"profile_id": session["profile_id"]}) or {}
    favs = set(progress_doc.get("favourite_memory_ids", []))
    out = []
    for d in docs:
        p = memory_to_public(d)
        p["favourite"] = p["id"] in favs
        out.append(p)
    return out


@api.get("/memories/{slug}")
async def get_memory(slug: str, session: dict = Depends(get_session)):
    doc = await db.memories.find_one({"slug": slug, "published": True})
    if not doc:
        raise HTTPException(status_code=404, detail="memory-not-found")
    progress_doc = await db.progress.find_one({"profile_id": session["profile_id"]}) or {}
    favs = set(progress_doc.get("favourite_memory_ids", []))
    p = memory_to_public(doc)
    p["favourite"] = p["id"] in favs
    return p


@api.post("/memories/{slug}/favourite")
async def toggle_memory_favourite(
    slug: str, payload: MemoryFavoriteIn, session: dict = Depends(get_session)
):
    doc = await db.memories.find_one({"slug": slug, "published": True})
    if not doc:
        raise HTTPException(status_code=404, detail="memory-not-found")
    profile_id = session["profile_id"]
    memory_id = str(doc["_id"])

    progress_doc = await db.progress.find_one({"profile_id": profile_id}) or {}
    favs = set(progress_doc.get("favourite_memory_ids", []))
    if payload.favourite:
        favs.add(memory_id)
    else:
        favs.discard(memory_id)
    await db.progress.update_one(
        {"profile_id": profile_id},
        {
            "$set": {
                "favourite_memory_ids": sorted(favs),
                "updated_at": now_utc().isoformat(),
            }
        },
        upsert=True,
    )
    return {"favourite": payload.favourite}


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    await ensure_seed()
    log.info("Ayesha's Private Universe backend started.")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
