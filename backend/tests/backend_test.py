"""Backend tests for Ayesha's Private Universe (Phase 1).

Notes:
- profile_id is always 'ayesha' (single-user), so progress state is shared
  across all sessions. We clean the progress DB between tests.
- Gateway rate limit = 12 attempts / 15 min per IP. Tests reuse a shared
  auth session where possible; the rate-limit test runs LAST and requires
  a backend restart afterward if re-running.
"""
import os
import time
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ten-months.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

CORRECT_FORMS = [
    "17 September 2025",
    "17th September 2025",
    "17/09/2025",
    "17-09-2025",
    "17092025",
    "2025-09-17",
]


@pytest.fixture(scope="session")
def mongo():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


@pytest.fixture
def clean_progress(mongo):
    mongo.progress.delete_many({"profile_id": "ayesha"})
    yield
    mongo.progress.delete_many({"profile_id": "ayesha"})


def fresh_session():
    return requests.Session()


@pytest.fixture(scope="module")
def shared_auth_session():
    """One authenticated session reused across tests to preserve rate-limit budget."""
    s = requests.Session()
    r = s.post(f"{API}/auth/gateway", json={"answer": "17 September 2025"}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True
    return s


# ---------------- Gateway ----------------
class TestGateway:
    def test_wrong_answer(self):
        s = fresh_session()
        r = s.post(f"{API}/auth/gateway", json={"answer": "01 January 2000"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data == {"ok": False, "message": "wrong-date"}
        assert "apu_session" not in s.cookies.get_dict()

    @pytest.mark.parametrize("form", CORRECT_FORMS)
    def test_correct_answer_variants(self, form):
        s = fresh_session()
        r = s.post(f"{API}/auth/gateway", json={"answer": form}, timeout=15)
        assert r.status_code == 200, f"Form {form!r}: {r.text}"
        assert r.json()["ok"] is True, f"Form {form!r} rejected"
        raw_cookies = r.raw.headers.getlist("set-cookie") if hasattr(r.raw.headers, "getlist") else [r.headers.get("set-cookie", "")]
        joined = " ; ".join(raw_cookies)
        assert "apu_session" in joined, f"No apu_session cookie header for {form!r}"
        assert "httponly" in joined.lower()


# ---------------- Auth Me ----------------
class TestAuthMe:
    def test_me_without_cookie(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_cookie(self, shared_auth_session):
        r = shared_auth_session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        assert r.json() == {"profile_id": "ayesha"}


# ---------------- Progress ----------------
class TestProgress:
    def test_default_progress(self, shared_auth_session, clean_progress):
        r = shared_auth_session.get(f"{API}/progress", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["sections_explored"] == []
        assert data["hidden_scroll_eligible"] is False
        assert data["hidden_scroll_found"] is False
        assert data["final_reveal_unlocked"] is False
        assert data["final_reveal_viewed"] is False

    def test_section_tracking_eligibility(self, shared_auth_session, clean_progress):
        keys = ["our-story", "memories", "why-i-love-you", "ayesha"]
        last = None
        for k in keys:
            r = shared_auth_session.post(f"{API}/progress/section", json={"section_key": k}, timeout=15)
            assert r.status_code == 200
            last = r.json()
        assert last["hidden_scroll_eligible"] is True
        r = shared_auth_session.get(f"{API}/progress", timeout=15)
        assert r.json()["hidden_scroll_eligible"] is True

    def test_hidden_scroll_before_eligible(self, shared_auth_session, clean_progress):
        r = shared_auth_session.post(f"{API}/progress/hidden-scroll", timeout=15)
        assert r.status_code == 403
        assert r.json().get("detail") == "not-yet-eligible"

    def test_final_viewed_before_unlock(self, shared_auth_session, clean_progress):
        r = shared_auth_session.post(f"{API}/progress/final-viewed", timeout=15)
        assert r.status_code == 403
        assert r.json().get("detail") == "not-unlocked"

    def test_hidden_scroll_after_eligibility(self, shared_auth_session, clean_progress):
        for k in ["our-story", "memories", "why-i-love-you", "ameen"]:
            rr = shared_auth_session.post(f"{API}/progress/section", json={"section_key": k}, timeout=15)
            assert rr.status_code == 200
        r = shared_auth_session.post(f"{API}/progress/hidden-scroll", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["final_reveal_unlocked"] is True
        r = shared_auth_session.post(f"{API}/progress/final-viewed", timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_story_position_persistence(self, shared_auth_session, clean_progress):
        r = shared_auth_session.post(
            f"{API}/progress/story-position",
            json={"section_index": 5, "scroll_ratio": 0.4},
            timeout=15,
        )
        assert r.status_code == 200
        r = shared_auth_session.get(f"{API}/progress", timeout=15)
        sp = r.json().get("story_position", {})
        assert sp.get("section_index") == 5
        assert abs(sp.get("scroll_ratio", 0) - 0.4) < 1e-6


# ---------------- Memories ----------------
class TestMemories:
    def test_list_returns_8(self, shared_auth_session):
        r = shared_auth_session.get(f"{API}/memories", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 8
        slugs = {m["slug"] for m in data}
        assert "sep-17-the-match" in slugs

    def test_sep17_has_hidden_bow(self, shared_auth_session):
        r = shared_auth_session.get(f"{API}/memories/sep-17-the-match", timeout=15)
        assert r.status_code == 200
        assert r.json()["hidden_bow"] is True

    def test_other_memory_no_hidden_bow(self, shared_auth_session):
        r = shared_auth_session.get(f"{API}/memories/oct-11-first-kiss", timeout=15)
        assert r.status_code == 200
        assert r.json().get("hidden_bow", False) is False

    def test_favourite_toggle(self, shared_auth_session, clean_progress):
        r = shared_auth_session.post(
            f"{API}/memories/sep-17-the-match/favourite",
            json={"favourite": True},
            timeout=15,
        )
        assert r.status_code == 200
        r = shared_auth_session.get(f"{API}/memories", timeout=15)
        target = next(m for m in r.json() if m["slug"] == "sep-17-the-match")
        assert target["favourite"] is True


# ---------------- Rate limit (LAST) ----------------
class TestZRateLimit:
    def test_rate_limit_eventually_returns_429(self):
        s = fresh_session()
        hit_429 = False
        for _ in range(20):
            r = s.post(f"{API}/auth/gateway", json={"answer": "wrong"}, timeout=15)
            if r.status_code == 429:
                hit_429 = True
                break
        assert hit_429, "Expected 429 after too many wrong attempts"
