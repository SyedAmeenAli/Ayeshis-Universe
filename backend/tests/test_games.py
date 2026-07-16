"""Backend tests for GAMES sprint — Ayesha's Private Universe."""
import os
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

VALID_GAMES = {
    "case-1709", "jigsaw", "timeline", "ameen-quiz",
    "sushi-stack", "find-koko", "wreck-room",
}


@pytest.fixture(scope="session")
def mongo():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


@pytest.fixture(scope="module")
def auth():
    """Cookie-authenticated session (reused across all games tests)."""
    s = requests.Session()
    r = s.post(f"{API}/auth/gateway", json={"answer": "17 September 2025"}, timeout=15)
    assert r.status_code == 200 and r.json().get("ok") is True
    return s


@pytest.fixture(autouse=True)
def clean_games_state(mongo):
    """Wipe games state before each test to keep isolation."""
    mongo.game_saves.delete_many({"profile_id": "ayesha"})
    mongo.game_achievements.delete_many({"profile_id": "ayesha"})
    mongo.case_evidence_state.delete_many({"profile_id": "ayesha"})
    yield


# ---------------- Gateway sanity ----------------
class TestGatewayGames:
    def test_gateway_sets_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/gateway", json={"answer": "17 September 2025"}, timeout=15)
        assert r.status_code == 200
        assert r.json() == {"ok": True, "message": "welcome-home"}
        assert "apu_session" in s.cookies.get_dict()


# ---------------- Session gating on games endpoints ----------------
class TestGamesAuth:
    def test_games_index_requires_cookie(self):
        r = requests.get(f"{API}/games", timeout=15)
        assert r.status_code == 401

    def test_games_stats_requires_cookie(self):
        r = requests.get(f"{API}/games/stats", timeout=15)
        assert r.status_code == 401

    def test_games_save_requires_cookie(self):
        r = requests.get(f"{API}/games/jigsaw/save", timeout=15)
        assert r.status_code == 401


# ---------------- Games index + stats defaults ----------------
class TestGamesIndex:
    def test_games_index_returns_all_seven(self, auth):
        r = auth.get(f"{API}/games", timeout=15)
        assert r.status_code == 200
        games = r.json()["games"]
        assert set(games.keys()) == VALID_GAMES
        for key, save in games.items():
            assert save["status"] == "not_started"
            assert save["score"] == 0
            assert save["state"] == {}

    def test_stats_defaults_zero(self, auth):
        r = auth.get(f"{API}/games/stats", timeout=15)
        assert r.status_code == 200
        s = r.json()
        assert s["games_completed"] == 0
        assert s["highest_quiz_score"] == 0
        assert s["best_sushi_score"] == 0
        assert s["hidden_objects_found"] == 0
        assert s["achievements"] == 0


# ---------------- Quiz seed ----------------
class TestQuiz:
    def test_quiz_returns_10_questions(self, auth):
        r = auth.get(f"{API}/games/quiz/questions", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 10
        for q in data:
            assert "question_key" in q
            assert "question" in q
            assert isinstance(q["answers"], list) and len(q["answers"]) >= 2
            assert "correct_answer_id" in q


# ---------------- Save / get / restart ----------------
class TestGameSaveFlow:
    def test_put_and_get_save_roundtrip(self, auth):
        payload = {
            "state": {"placed": [1, 2, 3], "difficulty": "cute-baby"},
            "score": 40,
            "elapsed_seconds": 15,
            "status": "active",
        }
        r = auth.put(f"{API}/games/jigsaw/save", json=payload, timeout=15)
        assert r.status_code == 200
        saved = r.json()
        assert saved["game_key"] == "jigsaw"
        assert saved["score"] == 40
        assert saved["best_score"] == 40
        assert saved["state"]["difficulty"] == "cute-baby"

        r = auth.get(f"{API}/games/jigsaw/save", timeout=15)
        assert r.status_code == 200
        again = r.json()
        assert again["score"] == 40
        assert again["state"]["placed"] == [1, 2, 3]

    def test_invalid_game_key_returns_400(self, auth):
        r = auth.put(f"{API}/games/not-a-game/save", json={"state": {}, "score": 0}, timeout=15)
        assert r.status_code == 400

    def test_state_too_large_returns_413(self, auth):
        big_state = {"blob": "x" * (130 * 1024)}
        r = auth.put(f"{API}/games/jigsaw/save", json={"state": big_state, "score": 0}, timeout=15)
        assert r.status_code == 413

    def test_restart_resets_state_keeps_best_score(self, auth):
        auth.put(f"{API}/games/jigsaw/save",
                 json={"state": {"placed": [1, 2]}, "score": 200, "status": "active"}, timeout=15)
        r = auth.post(f"{API}/games/jigsaw/restart", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["state"] == {}
        assert d["status"] == "active"
        assert d["best_score"] == 200
        assert d["score"] == 0


# ---------------- Complete + achievements ----------------
class TestComplete:
    def test_complete_jigsaw_awards_achievement(self, auth):
        r = auth.post(f"{API}/games/jigsaw/complete",
                      json={"state": {"done": True}, "score": 200, "elapsed_seconds": 60}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "completed"
        assert d["best_score"] == 200

        r = auth.get(f"{API}/games/achievements", timeout=15)
        assert r.status_code == 200
        keys = [a["achievement_key"] for a in r.json()]
        assert "we-still-fit" in keys

    def test_complete_reflected_in_stats(self, auth):
        auth.post(f"{API}/games/ameen-quiz/complete",
                  json={"state": {}, "score": 90}, timeout=15)
        r = auth.get(f"{API}/games/stats", timeout=15)
        s = r.json()
        assert s["games_completed"] >= 1
        assert s["highest_quiz_score"] == 90


# ---------------- CASE evidence ----------------
class TestCaseEvidence:
    def test_pin_evidence_and_read_back(self, auth):
        r = auth.put(f"{API}/games/case-1709/evidence/msg-ayesha",
                     json={"pinned": True, "act": 1}, timeout=15)
        assert r.status_code == 200
        r = auth.get(f"{API}/games/case-1709/content", timeout=15)
        assert r.status_code == 200
        state = r.json()["evidence_state"]
        keys = {e["evidence_key"]: e for e in state}
        assert "msg-ayesha" in keys
        assert keys["msg-ayesha"]["pinned"] is True
