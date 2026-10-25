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
    assert response.json()["version"] == "1.4.2"


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
    assert created["mode"] == "Hardpoint"
    assert created["game_type"] == "scrim"
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


def test_blank_game_type_defaults_to_scrim(client):
    payload = make_match()
    payload["game_type"] = ""
    created = create_match(client, payload)
    assert created["game_type"] == "scrim"


def test_full_save_updates_map_mode_and_players(client):
    created = create_match(client)
    payload = make_match(match_id=created["id"])
    payload["result"] = "W"
    payload["score_us"] = 6
    payload["score_them"] = 4
    payload["mode"] = "snd"
    payload["map"] = "Raid"
    payload["us"][0]["kills"] = 20
    payload["us"].append(make_player("Charlie", kills=15))

    updated = create_match(client, payload)
    assert updated["id"] == created["id"]
    assert updated["added_at"] == created["added_at"]
    assert updated["played_at"] == created["played_at"]
    assert updated["result"] == "W"
    assert updated["score_us"] == 6
    assert updated["score_them"] == 4
    assert updated["mode"] == "Search & Destroy"
    assert updated["map"] == "Raid"

    us = {player["name"]: player for player in updated["us"]}
    assert len(us) == 3
    assert us["Alpha"]["kills"] == 20
    assert us["Charlie"]["kills"] == 15

    listed = client.get("/api/matches").json()
    assert len(listed) == 1


def test_patch_match_metadata(client):
    created = create_match(client)

    response = client.patch(
        f"/api/matches/{created['id']}",
        json={
            "opponent": "New Enemy",
            "tier": "t1h",
            "mode": "CONTROL RAID",
            "game_type": "Tournament"
        }
    )
    assert response.status_code == 200
    body = response.json()
    assert body["opponent"] == "New Enemy"
    assert body["tier"] == "T1H"
    assert body["game_type"] == "tournament"
    assert body["mode"] == "Control"

    # A bare main tier defaults to Mid instead of failing validation.
    mid = client.patch(f"/api/matches/{created['id']}", json={"tier": "T2"})
    assert mid.status_code == 200
    assert mid.json()["tier"] == "T2M"

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
