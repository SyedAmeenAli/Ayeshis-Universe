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

import base64

from bson import ObjectId
from cryptography.fernet import Fernet
from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, Depends, FastAPI, HTTPException, Request, Response, status
if os.environ.get("USE_MOCK_DB") == "1":
    from mongomock_motor import AsyncMongoMockClient as AsyncIOMotorClient
else:
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

STUDIO_PIN = os.environ.get("STUDIO_PIN", "AMEEN1709")
STUDIO_COOKIE = "apu_studio_session"

DIARY_PIN = os.environ.get("DIARY_PIN", "1709")
_DIARY_KEY = base64.urlsafe_b64encode(hashlib.sha256(SESSION_SECRET.encode()).digest())
_diary_fernet = Fernet(_DIARY_KEY)


def encrypt_diary_body(plain: str) -> str:
    return _diary_fernet.encrypt(plain.encode()).decode()


def decrypt_diary_body(token: str) -> str:
    try:
        return _diary_fernet.decrypt(token.encode()).decode()
    except Exception:
        return ""

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


def make_studio_token() -> str:
    rand = secrets.token_urlsafe(24)
    sig = hmac.new(SESSION_SECRET.encode(), f"studio.{rand}".encode(), hashlib.sha256).hexdigest()
    return f"studio.{rand}.{sig}"


def verify_studio_token(token: str) -> bool:
    if not token:
        return False
    try:
        subject, rand, sig = token.split(".", 2)
    except ValueError:
        return False
    if subject != "studio":
        return False
    expected = hmac.new(SESSION_SECRET.encode(), f"studio.{rand}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)


async def get_studio_session(request: Request) -> dict:
    token = request.cookies.get(STUDIO_COOKIE)
    if not verify_studio_token(token or ""):
        raise HTTPException(status_code=401, detail="Studio session expired or missing")
    return {"role": "ameen_admin"}


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
async def get_diary_session(session: dict = Depends(get_session)) -> dict:
    profile_id = session["profile_id"]
    doc = await db.progress.find_one({"profile_id": profile_id}) or {}
    if not doc.get("diary_unlocked"):
        raise HTTPException(status_code=403, detail="diary-locked")
    return session


class GatewayIn(BaseModel):
    answer: str


class DiaryUnlockIn(BaseModel):
    pin: str


class DiaryEntryIn(BaseModel):
    body: str
    mood: str
    wants_comfort: bool = False
    wants_no_advice: bool = False


class DiaryEntryUpdate(BaseModel):
    body: Optional[str] = None
    mood: Optional[str] = None
    wants_comfort: Optional[bool] = None
    wants_no_advice: Optional[bool] = None
    shared: Optional[bool] = None


ACTIVITY_TYPES = [
    "sushi_date", "long_drive", "cafe_date", "movie", "study_date",
    "home_call", "orr_drive", "surprise_me", "just_you", "custom",
]
SLOT_STATUSES = {"available", "maybe", "busy", "surprise"}


class SlotCreateIn(BaseModel):
    date: str  # YYYY-MM-DD
    time_label: str
    status: str = "available"
    activity_hint: str = ""


class SlotUpdateIn(BaseModel):
    status: Optional[str] = None
    activity_hint: Optional[str] = None


class BookingIn(BaseModel):
    activity: str
    note: str = ""
    mood: str = ""


class StudioLoginIn(BaseModel):
    pin: str


DEFAULT_FEATURE_FLAGS = {
    "our_song_enabled": True,
    "wreck_room_enabled": True,
    "safe_space_enabled": True,
    "calendar_enabled": True,
    "final_reveal_enabled": True,
}


class FeatureFlagsIn(BaseModel):
    our_song_enabled: Optional[bool] = None
    wreck_room_enabled: Optional[bool] = None
    safe_space_enabled: Optional[bool] = None
    calendar_enabled: Optional[bool] = None
    final_reveal_enabled: Optional[bool] = None


class QuizQuestionUpdate(BaseModel):
    question: Optional[str] = None
    answers: Optional[list] = None
    correct_answer_id: Optional[str] = None
    explanation: Optional[str] = None
    enabled: Optional[bool] = None


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


class GalleryReactionIn(BaseModel):
    favourite: Optional[bool] = None
    rating: Optional[str] = None


AMEEN_RATING_OPTIONS = {"cute", "handsome", "baby_boy", "remove_immediately", "certified_potty"}


class SaveMomentIn(BaseModel):
    caption: str = ""


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


async def ensure_seed_calendar() -> None:
    count = await db.availability_slots.count_documents({})
    if count > 0:
        return
    statuses = ["available", "available", "maybe", "busy", "available", "surprise", "available"]
    docs = []
    for i in range(14):
        d = (now_utc() + timedelta(days=i + 1)).date().isoformat()
        docs.append({
            "date": d,
            "time_label": "19:30",
            "status": statuses[i % len(statuses)],
            "activity_hint": "",
            "created_by": "ameen",
            "created_at": now_utc().isoformat(),
            "updated_at": now_utc().isoformat(),
        })
    await db.availability_slots.insert_many(docs)
    log.info("Seeded %d availability slots", len(docs))


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


# ---------------------------- Galleries (Ayesha / Ameen) ----------------------------
@api.get("/gallery/{gallery}")
async def get_gallery_reactions(gallery: str, session: dict = Depends(get_session)):
    if gallery not in ("ayesha", "ameen"):
        raise HTTPException(status_code=404, detail="unknown-gallery")
    profile_id = session["profile_id"]
    doc = await db.gallery_reactions.find_one({"profile_id": profile_id, "gallery": gallery}) or {}
    return doc.get("items", {})


@api.post("/gallery/{gallery}/{item_id}/react")
async def react_to_gallery_item(
    gallery: str, item_id: str, payload: GalleryReactionIn, session: dict = Depends(get_session)
):
    if gallery not in ("ayesha", "ameen"):
        raise HTTPException(status_code=404, detail="unknown-gallery")
    if payload.rating is not None and payload.rating not in AMEEN_RATING_OPTIONS:
        raise HTTPException(status_code=400, detail="invalid-rating")
    profile_id = session["profile_id"]
    doc = await db.gallery_reactions.find_one({"profile_id": profile_id, "gallery": gallery}) or {}
    items = doc.get("items", {})
    entry = items.get(item_id, {})
    if payload.favourite is not None:
        entry["favourite"] = payload.favourite
    if payload.rating is not None:
        entry["rating"] = payload.rating
    items[item_id] = entry
    await db.gallery_reactions.update_one(
        {"profile_id": profile_id, "gallery": gallery},
        {"$set": {"items": items, "updated_at": now_utc().isoformat()}},
        upsert=True,
    )
    return entry


@api.post("/our-song/save-moment")
async def save_our_song_moment(payload: SaveMomentIn, session: dict = Depends(get_session)):
    slug = f"our-song-moment-{secrets.token_hex(4)}"
    doc = {
        "slug": slug,
        "title": "A Moment From Our Song",
        "short_caption": payload.caption or "Saved while listening to our song.",
        "body": payload.caption or "A moment saved while listening to our song together.",
        "memory_date": now_utc().date().isoformat(),
        "date_precision": "day",
        "location_label": "",
        "category": "saved_song_moments",
        "tags": ["our-song", "saved"],
        "cover_asset": {
            "asset_id": f"SONG-MOMENT-{secrets.token_hex(3)}",
            "type": "photograph",
            "orientation": "portrait",
            "resolution": "1600 × 2000 px",
            "aspect": "4:5",
            "content_needed": "The moment you were listening to when you saved this.",
            "filename": f"{slug}.webp",
        },
        "published": True,
        "sort_index": 999,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
    }
    result = await db.memories.insert_one(doc)
    doc["_id"] = result.inserted_id
    return memory_to_public(doc)


# ---------------------------- Studio (Ameen's private admin) ----------------------------
@api.post("/studio/login")
async def studio_login(payload: StudioLoginIn, response: Response):
    if not hmac.compare_digest(payload.pin.strip(), STUDIO_PIN):
        raise HTTPException(status_code=401, detail="wrong-pin")
    token = make_studio_token()
    response.set_cookie(
        key=STUDIO_COOKIE,
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=SESSION_TTL_DAYS * 24 * 3600,
        path="/",
    )
    return {"ok": True}


@api.post("/studio/logout")
async def studio_logout(response: Response):
    response.delete_cookie(STUDIO_COOKIE, path="/")
    return {"ok": True}


@api.get("/studio/me")
async def studio_me(session: dict = Depends(get_studio_session)):
    return session


@api.get("/studio/dashboard")
async def studio_dashboard(session: dict = Depends(get_studio_session)):
    memories_count = await db.memories.count_documents({})
    bookings_count = await db.bookings.count_documents({"status": "confirmed"})
    diary_count = await db.diary_entries.count_documents({})
    achievements_count = await db.game_achievements.count_documents({})
    progress_doc = await db.progress.find_one({"profile_id": "ayesha"}) or {}
    return {
        "memories_count": memories_count,
        "upcoming_bookings": bookings_count,
        "diary_entries": diary_count,
        "achievements_unlocked": achievements_count,
        "final_reveal_unlocked": progress_doc.get("final_reveal_unlocked", False),
        "final_reveal_viewed": progress_doc.get("final_reveal_viewed", False),
        "hidden_scroll_found": progress_doc.get("hidden_scroll_found", False),
        "real_photos_configured": 23,
    }


@api.get("/studio/feature-flags")
async def get_feature_flags():
    doc = await db.settings.find_one({"key": "feature_flags"})
    flags = dict(DEFAULT_FEATURE_FLAGS)
    if doc:
        flags.update(doc.get("value", {}))
    return flags


@api.put("/studio/feature-flags")
async def update_feature_flags(payload: FeatureFlagsIn, session: dict = Depends(get_studio_session)):
    doc = await db.settings.find_one({"key": "feature_flags"})
    flags = dict(DEFAULT_FEATURE_FLAGS)
    if doc:
        flags.update(doc.get("value", {}))
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    flags.update(updates)
    await db.settings.update_one(
        {"key": "feature_flags"}, {"$set": {"value": flags, "updated_at": now_utc().isoformat()}}, upsert=True
    )
    return flags


@api.get("/studio/quiz/questions")
async def studio_list_quiz(session: dict = Depends(get_studio_session)):
    docs = await db.quiz_questions.find({}).sort("sort_order", 1).to_list(200)
    return [
        {
            "question_key": d.get("question_key"),
            "question": d.get("question"),
            "answers": d.get("answers", []),
            "correct_answer_id": d.get("correct_answer_id"),
            "explanation": d.get("explanation"),
            "enabled": d.get("enabled", True),
        }
        for d in docs
    ]


@api.put("/studio/quiz/questions/{question_key}")
async def studio_update_quiz(question_key: str, payload: QuizQuestionUpdate, session: dict = Depends(get_studio_session)):
    doc = await db.quiz_questions.find_one({"question_key": question_key})
    if not doc:
        raise HTTPException(status_code=404, detail="question-not-found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.quiz_questions.update_one({"_id": doc["_id"]}, {"$set": updates})
    doc.update(updates)
    return {
        "question_key": doc.get("question_key"),
        "question": doc.get("question"),
        "answers": doc.get("answers", []),
        "correct_answer_id": doc.get("correct_answer_id"),
        "explanation": doc.get("explanation"),
        "enabled": doc.get("enabled", True),
    }


# ---------------------------- Calendar / booking ----------------------------
def slot_to_public(doc: dict, booking: dict | None) -> dict:
    return {
        "id": str(doc.get("_id")),
        "date": doc.get("date"),
        "time_label": doc.get("time_label"),
        "status": doc.get("status"),
        "activity_hint": doc.get("activity_hint", ""),
        "booking": booking_to_public(booking) if booking else None,
    }


def booking_to_public(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id")),
        "slot_id": str(doc.get("slot_id")),
        "activity": doc.get("activity"),
        "note": doc.get("note", ""),
        "mood": doc.get("mood", ""),
        "status": doc.get("status"),
        "created_at": doc.get("created_at"),
    }


@api.get("/calendar/activity-types")
async def get_activity_types():
    return ACTIVITY_TYPES


@api.get("/calendar/slots")
async def list_calendar_slots(session: dict = Depends(get_session)):
    slots = await db.availability_slots.find({}).sort("date", 1).to_list(500)
    slot_ids = [s["_id"] for s in slots]
    bookings = await db.bookings.find({"slot_id": {"$in": slot_ids}, "status": {"$ne": "cancelled"}}).to_list(500)
    bookings_by_slot = {b["slot_id"]: b for b in bookings}
    return [slot_to_public(s, bookings_by_slot.get(s["_id"])) for s in slots]


@api.post("/calendar/slots/{slot_id}/book")
async def book_slot(slot_id: str, payload: BookingIn, session: dict = Depends(get_session)):
    slot = await db.availability_slots.find_one({"_id": ObjectId(slot_id)})
    if not slot:
        raise HTTPException(status_code=404, detail="slot-not-found")
    if slot.get("status") not in ("available", "surprise", "maybe"):
        raise HTTPException(status_code=409, detail="slot-not-bookable")
    if payload.activity not in ACTIVITY_TYPES:
        raise HTTPException(status_code=400, detail="invalid-activity")

    booking_doc = {
        "slot_id": slot["_id"],
        "profile_id": session["profile_id"],
        "activity": payload.activity,
        "note": payload.note,
        "mood": payload.mood,
        "status": "confirmed",
        "created_at": now_utc().isoformat(),
    }
    result = await db.bookings.insert_one(booking_doc)
    booking_doc["_id"] = result.inserted_id
    await db.availability_slots.update_one(
        {"_id": slot["_id"]}, {"$set": {"status": "busy", "updated_at": now_utc().isoformat()}}
    )
    slot["status"] = "busy"
    return slot_to_public(slot, booking_doc)


@api.post("/calendar/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, session: dict = Depends(get_session)):
    booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="booking-not-found")
    await db.bookings.update_one({"_id": booking["_id"]}, {"$set": {"status": "cancelled"}})
    await db.availability_slots.update_one(
        {"_id": booking["slot_id"]}, {"$set": {"status": "available", "updated_at": now_utc().isoformat()}}
    )
    return {"ok": True}


@api.post("/calendar/slots")
async def create_slot(payload: SlotCreateIn, session: dict = Depends(get_studio_session)):
    if payload.status not in SLOT_STATUSES:
        raise HTTPException(status_code=400, detail="invalid-status")
    doc = {
        "date": payload.date,
        "time_label": payload.time_label,
        "status": payload.status,
        "activity_hint": payload.activity_hint,
        "created_by": "ameen",
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
    }
    result = await db.availability_slots.insert_one(doc)
    doc["_id"] = result.inserted_id
    return slot_to_public(doc, None)


@api.put("/calendar/slots/{slot_id}")
async def update_slot(slot_id: str, payload: SlotUpdateIn, session: dict = Depends(get_studio_session)):
    slot = await db.availability_slots.find_one({"_id": ObjectId(slot_id)})
    if not slot:
        raise HTTPException(status_code=404, detail="slot-not-found")
    updates = {"updated_at": now_utc().isoformat()}
    if payload.status is not None:
        if payload.status not in SLOT_STATUSES:
            raise HTTPException(status_code=400, detail="invalid-status")
        updates["status"] = payload.status
    if payload.activity_hint is not None:
        updates["activity_hint"] = payload.activity_hint
    await db.availability_slots.update_one({"_id": slot["_id"]}, {"$set": updates})
    slot.update(updates)
    return slot_to_public(slot, None)


# ---------------------------- Safe Space (diary) ----------------------------
def diary_entry_to_public(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id")),
        "body": decrypt_diary_body(doc.get("body_encrypted", "")),
        "mood": doc.get("mood"),
        "wants_comfort": doc.get("wants_comfort", False),
        "wants_no_advice": doc.get("wants_no_advice", False),
        "shared": doc.get("shared", False),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@api.get("/diary/status")
async def diary_status(session: dict = Depends(get_session)):
    doc = await db.progress.find_one({"profile_id": session["profile_id"]}) or {}
    return {"unlocked": bool(doc.get("diary_unlocked"))}


@api.post("/diary/unlock")
async def diary_unlock(payload: DiaryUnlockIn, session: dict = Depends(get_session)):
    if not hmac.compare_digest(payload.pin.strip(), DIARY_PIN):
        raise HTTPException(status_code=401, detail="wrong-pin")
    await db.progress.update_one(
        {"profile_id": session["profile_id"]},
        {"$set": {"diary_unlocked": True, "updated_at": now_utc().isoformat()}},
        upsert=True,
    )
    return {"unlocked": True}


@api.get("/diary/entries")
async def list_diary_entries(session: dict = Depends(get_diary_session)):
    docs = await db.diary_entries.find({"profile_id": session["profile_id"]}).sort("created_at", -1).to_list(500)
    return [diary_entry_to_public(d) for d in docs]


@api.post("/diary/entries")
async def create_diary_entry(payload: DiaryEntryIn, session: dict = Depends(get_diary_session)):
    doc = {
        "profile_id": session["profile_id"],
        "body_encrypted": encrypt_diary_body(payload.body),
        "mood": payload.mood,
        "wants_comfort": payload.wants_comfort,
        "wants_no_advice": payload.wants_no_advice,
        "shared": False,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
    }
    result = await db.diary_entries.insert_one(doc)
    doc["_id"] = result.inserted_id
    return diary_entry_to_public(doc)


@api.put("/diary/entries/{entry_id}")
async def update_diary_entry(entry_id: str, payload: DiaryEntryUpdate, session: dict = Depends(get_diary_session)):
    doc = await db.diary_entries.find_one({"_id": ObjectId(entry_id), "profile_id": session["profile_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="entry-not-found")
    updates = {"updated_at": now_utc().isoformat()}
    if payload.body is not None:
        updates["body_encrypted"] = encrypt_diary_body(payload.body)
    if payload.mood is not None:
        updates["mood"] = payload.mood
    if payload.wants_comfort is not None:
        updates["wants_comfort"] = payload.wants_comfort
    if payload.wants_no_advice is not None:
        updates["wants_no_advice"] = payload.wants_no_advice
    if payload.shared is not None:
        updates["shared"] = payload.shared
    await db.diary_entries.update_one({"_id": doc["_id"]}, {"$set": updates})
    doc.update(updates)
    return diary_entry_to_public(doc)


@api.delete("/diary/entries/{entry_id}")
async def delete_diary_entry(entry_id: str, session: dict = Depends(get_diary_session)):
    result = await db.diary_entries.delete_one({"_id": ObjectId(entry_id), "profile_id": session["profile_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="entry-not-found")
    return {"ok": True}


@api.get("/gallery/ameen/stats")
async def get_ameen_gallery_stats(session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    doc = await db.gallery_reactions.find_one({"profile_id": profile_id, "gallery": "ameen"}) or {}
    counts = {k: 0 for k in AMEEN_RATING_OPTIONS}
    for entry in doc.get("items", {}).values():
        r = entry.get("rating")
        if r in counts:
            counts[r] += 1
    return counts


# ---------------------------------------------------------------------------
# GAMES — models + endpoints
# ---------------------------------------------------------------------------
VALID_GAME_KEYS = {
    "case-1709",
    "jigsaw",
    "timeline",
    "ameen-quiz",
    "sushi-stack",
    "find-koko",
    "wreck-room",
}


class GameSaveIn(BaseModel):
    state: dict = Field(default_factory=dict)
    score: int = 0
    elapsed_seconds: int = 0
    status: str = "active"  # not_started | active | paused | completed


class GameCompleteIn(BaseModel):
    state: dict = Field(default_factory=dict)
    score: int = 0
    elapsed_seconds: int = 0
    metadata: dict = Field(default_factory=dict)


class AchievementIn(BaseModel):
    achievement_key: str
    game_key: str
    metadata: dict = Field(default_factory=dict)


class EvidenceIn(BaseModel):
    inspected: Optional[bool] = None
    pinned: Optional[bool] = None
    classification: Optional[str] = None
    notes: Optional[str] = None
    board_position: Optional[dict] = None
    act: Optional[int] = None


def _validate_game_key(key: str) -> None:
    if key not in VALID_GAME_KEYS:
        raise HTTPException(status_code=400, detail="invalid-game-key")


def _game_save_public(doc: Optional[dict], game_key: str, profile_id: str) -> dict:
    if not doc:
        return {
            "game_key": game_key,
            "profile_id": profile_id,
            "status": "not_started",
            "state": {},
            "score": 0,
            "best_score": 0,
            "elapsed_seconds": 0,
            "attempts": 0,
            "started_at": None,
            "updated_at": None,
            "completed_at": None,
        }
    return {
        "game_key": doc.get("game_key"),
        "profile_id": doc.get("profile_id"),
        "status": doc.get("status", "not_started"),
        "state": doc.get("state", {}),
        "score": doc.get("score", 0),
        "best_score": doc.get("best_score", 0),
        "elapsed_seconds": doc.get("elapsed_seconds", 0),
        "attempts": doc.get("attempts", 0),
        "started_at": doc.get("started_at"),
        "updated_at": doc.get("updated_at"),
        "completed_at": doc.get("completed_at"),
    }


@api.get("/games")
async def games_index(session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    docs = await db.game_saves.find({"profile_id": profile_id}).to_list(50)
    saves = {d.get("game_key"): _game_save_public(d, d.get("game_key"), profile_id) for d in docs}
    result = {}
    for key in VALID_GAME_KEYS:
        result[key] = saves.get(key, _game_save_public(None, key, profile_id))
    return {"games": result}


@api.get("/games/stats")
async def games_stats(session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    docs = await db.game_saves.find({"profile_id": profile_id}).to_list(50)
    completed = sum(1 for d in docs if d.get("status") == "completed")
    total_seconds = sum(d.get("elapsed_seconds", 0) for d in docs)

    def best(key):
        for d in docs:
            if d.get("game_key") == key:
                return d.get("best_score", 0)
        return 0

    def elapsed(key):
        for d in docs:
            if d.get("game_key") == key:
                return d.get("elapsed_seconds", 0)
        return 0

    ach = await db.game_achievements.count_documents({"profile_id": profile_id})
    case_doc = next((d for d in docs if d.get("game_key") == "case-1709"), None)
    current_act = (case_doc or {}).get("state", {}).get("current_act", "act-i")
    detective_score = (case_doc or {}).get("best_score", 0)
    solved = len(((case_doc or {}).get("state", {}) or {}).get("solved_puzzles", []))

    hidden_found = await db.game_saves.find_one(
        {"profile_id": profile_id, "game_key": "find-koko"}
    )
    hidden_count = len((((hidden_found or {}).get("state") or {}).get("found", [])))

    return {
        "games_completed": completed,
        "total_play_seconds": total_seconds,
        "highest_quiz_score": best("ameen-quiz"),
        "best_sushi_score": best("sushi-stack"),
        "fastest_jigsaw_seconds": elapsed("jigsaw"),
        "timeline_accuracy": best("timeline"),
        "case_detective_score": detective_score,
        "case_current_act": current_act,
        "case_puzzles_solved": solved,
        "hidden_objects_found": hidden_count,
        "achievements": ach,
    }


@api.get("/games/{game_key}/save")
async def game_get_save(game_key: str, session: dict = Depends(get_session)):
    _validate_game_key(game_key)
    profile_id = session["profile_id"]
    doc = await db.game_saves.find_one({"profile_id": profile_id, "game_key": game_key})
    return _game_save_public(doc, game_key, profile_id)


@api.put("/games/{game_key}/save")
async def game_put_save(
    game_key: str, payload: GameSaveIn, session: dict = Depends(get_session)
):
    _validate_game_key(game_key)
    profile_id = session["profile_id"]
    # State size guard — reject anything larger than ~128 KB when serialised
    import json as _json
    if len(_json.dumps(payload.state)) > 128 * 1024:
        raise HTTPException(status_code=413, detail="state-too-large")

    now = now_utc().isoformat()
    existing = await db.game_saves.find_one({"profile_id": profile_id, "game_key": game_key})
    best_score = max(payload.score, (existing or {}).get("best_score", 0))

    update = {
        "profile_id": profile_id,
        "game_key": game_key,
        "state": payload.state,
        "score": payload.score,
        "best_score": best_score,
        "elapsed_seconds": payload.elapsed_seconds,
        "status": payload.status if payload.status in {"not_started", "active", "paused", "completed"} else "active",
        "updated_at": now,
        "started_at": (existing or {}).get("started_at") or now,
        "attempts": (existing or {}).get("attempts", 0),
    }
    await db.game_saves.update_one(
        {"profile_id": profile_id, "game_key": game_key},
        {"$set": update},
        upsert=True,
    )
    return _game_save_public(update, game_key, profile_id)


@api.post("/games/{game_key}/start")
async def game_start(game_key: str, session: dict = Depends(get_session)):
    _validate_game_key(game_key)
    profile_id = session["profile_id"]
    now = now_utc().isoformat()
    existing = await db.game_saves.find_one({"profile_id": profile_id, "game_key": game_key})
    attempts = ((existing or {}).get("attempts", 0)) + 1
    doc = {
        "profile_id": profile_id,
        "game_key": game_key,
        "status": "active",
        "state": (existing or {}).get("state", {}),
        "score": (existing or {}).get("score", 0),
        "best_score": (existing or {}).get("best_score", 0),
        "elapsed_seconds": (existing or {}).get("elapsed_seconds", 0),
        "attempts": attempts,
        "started_at": (existing or {}).get("started_at") or now,
        "updated_at": now,
    }
    await db.game_saves.update_one(
        {"profile_id": profile_id, "game_key": game_key},
        {"$set": doc}, upsert=True,
    )
    return _game_save_public(doc, game_key, profile_id)


@api.post("/games/{game_key}/complete")
async def game_complete(
    game_key: str, payload: GameCompleteIn, session: dict = Depends(get_session)
):
    _validate_game_key(game_key)
    profile_id = session["profile_id"]
    now = now_utc().isoformat()
    existing = await db.game_saves.find_one({"profile_id": profile_id, "game_key": game_key})
    best_score = max(payload.score, (existing or {}).get("best_score", 0))
    doc = {
        "profile_id": profile_id,
        "game_key": game_key,
        "status": "completed",
        "state": payload.state,
        "score": payload.score,
        "best_score": best_score,
        "elapsed_seconds": payload.elapsed_seconds,
        "attempts": (existing or {}).get("attempts", 1),
        "started_at": (existing or {}).get("started_at") or now,
        "updated_at": now,
        "completed_at": now,
    }
    await db.game_saves.update_one(
        {"profile_id": profile_id, "game_key": game_key},
        {"$set": doc}, upsert=True,
    )

    # Optionally auto-award game-specific achievement
    achievement_map = {
        "jigsaw": "we-still-fit",
        "timeline": "official-relationship-historian",
        "ameen-quiz": "certified-ayeshi",
        "sushi-stack": "certified-sushi-engineer",
        "find-koko": "chota-koko-recovery-specialist",
        "case-1709": "master-detective-ayesha",
    }
    ach_key = achievement_map.get(game_key)
    if ach_key:
        await db.game_achievements.update_one(
            {"profile_id": profile_id, "achievement_key": ach_key},
            {"$set": {
                "profile_id": profile_id,
                "achievement_key": ach_key,
                "game_key": game_key,
                "metadata": payload.metadata,
                "unlocked_at": now,
            }},
            upsert=True,
        )

    return _game_save_public(doc, game_key, profile_id)


@api.post("/games/{game_key}/restart")
async def game_restart(game_key: str, session: dict = Depends(get_session)):
    _validate_game_key(game_key)
    profile_id = session["profile_id"]
    existing = await db.game_saves.find_one({"profile_id": profile_id, "game_key": game_key})
    best_score = (existing or {}).get("best_score", 0)
    attempts = ((existing or {}).get("attempts", 0)) + 1
    now = now_utc().isoformat()
    doc = {
        "profile_id": profile_id,
        "game_key": game_key,
        "status": "active",
        "state": {},
        "score": 0,
        "best_score": best_score,
        "elapsed_seconds": 0,
        "attempts": attempts,
        "started_at": now,
        "updated_at": now,
        "completed_at": None,
    }
    await db.game_saves.update_one(
        {"profile_id": profile_id, "game_key": game_key},
        {"$set": doc}, upsert=True,
    )
    return _game_save_public(doc, game_key, profile_id)


@api.get("/games/achievements")
async def list_achievements(session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    docs = await db.game_achievements.find({"profile_id": profile_id}).to_list(100)
    for d in docs:
        d["_id"] = str(d.get("_id"))
    return docs


@api.post("/games/achievements/unlock")
async def unlock_achievement(payload: AchievementIn, session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    now = now_utc().isoformat()
    await db.game_achievements.update_one(
        {"profile_id": profile_id, "achievement_key": payload.achievement_key},
        {"$set": {
            "profile_id": profile_id,
            "achievement_key": payload.achievement_key,
            "game_key": payload.game_key,
            "metadata": payload.metadata,
            "unlocked_at": now,
        }},
        upsert=True,
    )
    return {"ok": True, "achievement_key": payload.achievement_key}


# CASE evidence state per user + evidence_key
@api.put("/games/case-1709/evidence/{evidence_key}")
async def put_evidence(
    evidence_key: str, payload: EvidenceIn, session: dict = Depends(get_session)
):
    profile_id = session["profile_id"]
    now = now_utc().isoformat()
    update = {
        "profile_id": profile_id,
        "evidence_key": evidence_key,
        "updated_at": now,
    }
    for field in ("inspected", "pinned", "classification", "notes", "board_position", "act"):
        v = getattr(payload, field)
        if v is not None:
            update[field] = v
    await db.case_evidence_state.update_one(
        {"profile_id": profile_id, "evidence_key": evidence_key},
        {"$set": update},
        upsert=True,
    )
    return {"ok": True, "evidence_key": evidence_key}


@api.get("/games/case-1709/content")
async def case_content(session: dict = Depends(get_session)):
    profile_id = session["profile_id"]
    docs = await db.case_evidence_state.find({"profile_id": profile_id}).to_list(500)
    for d in docs:
        d.pop("_id", None)
    return {"evidence_state": docs}


# Quiz questions (public via authenticated session)
QUIZ_SEED = [
    {"question_key": "q-nonchalant", "question": "What did Ameen sacrifice while trying to look nonchalant?", "answers": [{"id": "a", "label": "His phone"}, {"id": "b", "label": "His right hand and dignity"}, {"id": "c", "label": "His car key"}, {"id": "d", "label": "His coffee"}], "correct_answer_id": "b", "explanation": "The lift did not respect the performance.", "reaction_correct": "She remembers!", "reaction_wrong": "Suspicious.", "enabled": True, "sort_order": 1},
    {"question_key": "q-phrase", "question": "What phrase can explain almost any situation?", "answers": [{"id": "a", "label": "It is what it is"}, {"id": "b", "label": "Hum toh aise hi hai"}, {"id": "c", "label": "Meku bhook lagri"}, {"id": "d", "label": "Ask ChatGPT"}], "correct_answer_id": "b", "explanation": "The behavioural checksum.", "reaction_correct": "Certified Ayeshi behavior.", "reaction_wrong": "Girlfriend verification delayed.", "enabled": True, "sort_order": 2},
    {"question_key": "q-potty", "question": "What is our most intellectually advanced insult?", "answers": [{"id": "a", "label": "Potty"}, {"id": "b", "label": "Silence"}, {"id": "c", "label": "Hum toh aise hi hai"}, {"id": "d", "label": "Pungun"}], "correct_answer_id": "a", "explanation": "Beyond scientific measurement.", "reaction_correct": "Correct. Disturbingly.", "reaction_wrong": "Certified potty behaviour, but wrong.", "enabled": True, "sort_order": 3},
    {"question_key": "q-ringtone", "question": "Which word should never become a public ringtone?", "answers": [{"id": "a", "label": "Pungun"}, {"id": "b", "label": "Chota Koko"}, {"id": "c", "label": "Sushi"}, {"id": "d", "label": "Ayeshi"}], "correct_answer_id": "a", "explanation": "A family word, weaponised.", "reaction_correct": "Disturbingly accurate.", "reaction_wrong": "Baby, think again.", "enabled": True, "sort_order": 4},
    {"question_key": "q-password", "question": "Which word should never have become an encrypted password?", "answers": [{"id": "a", "label": "Tulip"}, {"id": "b", "label": "Cravery"}, {"id": "c", "label": "Potty"}, {"id": "d", "label": "Sushi"}], "correct_answer_id": "c", "explanation": "Ameen's cybersecurity standards are deeply concerning.", "reaction_correct": "Correct. Disturbingly.", "reaction_wrong": "Baby, think again.", "enabled": True, "sort_order": 4.5},
    {"question_key": "q-confession", "question": "What happened when Ayesha accidentally said 'I love you'?", "answers": [{"id": "a", "label": "She said it again on purpose"}, {"id": "b", "label": "She immediately acted as though it never happened"}, {"id": "c", "label": "She sent a voice note apologising"}, {"id": "d", "label": "She blamed autocorrect"}], "correct_answer_id": "b", "explanation": "Ayesha denies all allegations.", "reaction_correct": "She knows too much.", "reaction_wrong": "Girlfriend verification delayed.", "enabled": True, "sort_order": 5},
    {"question_key": "q-ball", "question": "What was Ameen's official reaction to the ball incident?", "answers": [{"id": "a", "label": "Laughed it off"}, {"id": "b", "label": "Sent a photo to Sarah"}, {"id": "c", "label": "Collapse, cry and document the tragedy forever"}, {"id": "d", "label": "Filed a police report"}], "correct_answer_id": "c", "explanation": "The male body is fragile.", "reaction_correct": "Certified Ayeshi behavior.", "reaction_wrong": "Baby, think again.", "enabled": True, "sort_order": 6},
    {"question_key": "q-sushi-demand", "question": "What food can Ayesha officially demand after winning Sushi Stack?", "answers": [{"id": "a", "label": "Biryani"}, {"id": "b", "label": "Sushi"}, {"id": "c", "label": "Ice cream"}, {"id": "d", "label": "Cravery lattes"}], "correct_answer_id": "b", "explanation": "Architectural excellence earns rolls.", "reaction_correct": "Sushi is a promise.", "reaction_wrong": "Suspicious.", "enabled": True, "sort_order": 7},
    {"question_key": "q-beginning", "question": "What was the beginning date?", "answers": [{"id": "a", "label": "17 September 2025"}, {"id": "b", "label": "25 September 2025"}, {"id": "c", "label": "11 October 2025"}, {"id": "d", "label": "12 December 2025"}], "correct_answer_id": "a", "explanation": "The Wednesday.", "reaction_correct": "She remembers.", "reaction_wrong": "Baby, that's the wrong password too.", "enabled": True, "sort_order": 8},
    {"question_key": "q-first-kiss", "question": "What was the first-kiss date?", "answers": [{"id": "a", "label": "17 September 2025"}, {"id": "b", "label": "25 September 2025"}, {"id": "c", "label": "11 October 2025"}, {"id": "d", "label": "14 February 2026"}], "correct_answer_id": "c", "explanation": "October 11 — the geometry of us changed.", "reaction_correct": "Certified.", "reaction_wrong": "Girlfriend trial version.", "enabled": True, "sort_order": 9},
    {"question_key": "q-proposal", "question": "What was the proposal date?", "answers": [{"id": "a", "label": "17 September 2025"}, {"id": "b", "label": "11 October 2025"}, {"id": "c", "label": "12 December 2025"}, {"id": "d", "label": "14 February 2026"}], "correct_answer_id": "c", "explanation": "The question became a promise.", "reaction_correct": "She knows too much. Delete the archive.", "reaction_wrong": "Baby, think again.", "enabled": True, "sort_order": 10},
]


@api.get("/games/quiz/questions")
async def list_quiz_questions(session: dict = Depends(get_session)):
    _ = session
    docs = await db.quiz_questions.find({"enabled": True}).sort("sort_order", 1).to_list(200)
    if not docs:
        return QUIZ_SEED
    return [
        {
            "question_key": d.get("question_key"),
            "question": d.get("question"),
            "answers": d.get("answers", []),
            "correct_answer_id": d.get("correct_answer_id"),
            "explanation": d.get("explanation"),
            "reaction_correct": d.get("reaction_correct"),
            "reaction_wrong": d.get("reaction_wrong"),
            "sort_order": d.get("sort_order", 0),
        }
        for d in docs
    ]


async def ensure_quiz_seed() -> None:
    count = await db.quiz_questions.count_documents({})
    if count == 0:
        docs = [dict(q) for q in QUIZ_SEED]
        for d in docs:
            d["created_at"] = now_utc().isoformat()
        await db.quiz_questions.insert_many(docs)
        log.info("Seeded %d quiz questions", len(docs))


# ---------------------------------------------------------------------------
# Startup — additional
@app.on_event("startup")
async def on_startup():
    await ensure_seed()
    await ensure_quiz_seed()
    await ensure_seed_calendar()
    # Unique index on (profile_id, game_key)
    try:
        await db.game_saves.create_index(
            [("profile_id", 1), ("game_key", 1)], unique=True
        )
        await db.game_achievements.create_index(
            [("profile_id", 1), ("achievement_key", 1)], unique=True
        )
        await db.case_evidence_state.create_index(
            [("profile_id", 1), ("evidence_key", 1)], unique=True
        )
    except Exception as e:
        log.warning("Index creation warning: %s", e)
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
