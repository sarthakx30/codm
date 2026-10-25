"""API smoke tests for health, matches, aliases, and parse endpoints."""
from typing import Any, Dict, Optional


def make_player(name: str, kills: int = 10, deaths: int = 5, score: int = 1200) -> Dict[str, Any]:
    return {
        "name": name,
        "raw_name": name,
        "score": score,
        "kills": kills,
        "deaths": deaths,
        "assists": 2,
        "impact": 80,
        "time": 45,
        "mvp": False
    }


def make_match(match_id: Optional[str] = None, opponent: str = "Enemy") -> Dict[str, Any]:
    return {
        "id": match_id,
        "result": "W",
        "score_us": 250,
        "score_them": 180,
        "mode": "Hardpoint",
        "map": "Standoff",
        "played_at_raw": "01:14:17 26-10-02",
        "played_at": "2026-10-02T01:14:17",
        "opponent": opponent,
        "tier": "T2M",
        "game_type": "Scrim",
        "us": [make_player("Alpha"), make_player("Bravo", kills=7)],
        "them": [make_player("Echo"), make_player("Foxtrot", kills=9)]
    }


def create_match(client, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    response = client.post("/api/matches", json={"match": payload or make_match(), "renames": {}})
    assert response.status_code == 201, response.text
    return response.json()


def test_root_reports_version(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["version"] == "1.4.1"


def test_health_returns_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["matches_count"] == 0
    assert body["database_type"] == "sqlite"


def test_create_match_generates_id(client):
    created = create_match(client)
    assert len(created["id"]) == 10
    assert created["opponent"] == "Enemy"
    assert len(created["us"]) == 2
    assert len(created["them"]) == 2

    listed = client.get("/api/matches").json()
    assert len(listed) == 1
    assert listed[0]["id"] == created["id"]


def test_save_is_upsert_without_player_duplicates(client):
    created = create_match(client)
    duplicate = create_match(client, make_match(match_id=created["id"]))

    assert duplicate["id"] == created["id"]
    assert len(duplicate["us"]) == 2
    assert len(duplicate["them"]) == 2

    listed = client.get("/api/matches").json()
    assert len(listed) == 1


def test_patch_match_metadata(client):
    created = create_match(client)

    response = client.patch(
        f"/api/matches/{created['id']}",
        json={"opponent": "New Enemy", "tier": "T1H", "game_type": "Tournament"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["opponent"] == "New Enemy"
    assert body["tier"] == "T1H"
    assert body["game_type"] == "Tournament"
    assert body["mode"] == "Hardpoint"

    missing = client.patch("/api/matches/does-not-exist", json={"tier": "T1H"})
    assert missing.status_code == 404


def test_delete_match(client):
    created = create_match(client)

    response = client.delete(f"/api/matches/{created['id']}")
    assert response.status_code == 200
    assert response.json()["deleted"] is True

    assert client.get(f"/api/matches/{created['id']}").status_code == 404
    assert client.delete(f"/api/matches/{created['id']}").status_code == 404


def test_alias_create_and_delete(client):
    response = client.post("/api/aliases", json={"RawName": "Canonical"})
    assert response.status_code == 200
    assert client.get("/api/aliases").json() == {"RawName": "Canonical"}

    records = client.get("/api/aliases/records").json()
    assert records[0]["canonical_name"] == "Canonical"

    assert client.delete("/api/aliases/RawName").status_code == 200
    assert client.delete("/api/aliases/RawName").status_code == 404


def test_parse_rejects_empty_body(client):
    response = client.post("/api/parse")
    assert response.status_code == 400
