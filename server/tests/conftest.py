"""Shared pytest fixtures for the API test suite."""
import pytest
from fastapi.testclient import TestClient

from database.connection import db
from server.main import app

@pytest.fixture()
def client(tmp_path, monkeypatch):
    """Run the app against a temporary local SQLite database."""
    monkeypatch.setattr(db, "_is_turso", False)
    monkeypatch.setattr(db, "db_url", "")
    monkeypatch.setenv("CODM_DB_PATH", str(tmp_path / "test.db"))
    with TestClient(app) as test_client:
        yield test_client
