"""Database connection manager for Turso (libSQL) and local SQLite."""
import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import libsql_client

DB_DIR = Path(__file__).resolve().parent
DEFAULT_LOCAL_DB = DB_DIR / "codm.db"
SCHEMA_FILE = DB_DIR / "schema.sql"

class Database:
    def __init__(self, db_url: Optional[str] = None, auth_token: Optional[str] = None):
        self.db_url = db_url or os.environ.get("TURSO_DATABASE_URL", "")
        self.auth_token = auth_token or os.environ.get("TURSO_AUTH_TOKEN", "")
        self._is_turso = bool(
            self.db_url and ("turso.io" in self.db_url or self.db_url.startswith("libsql://"))
        )

    def get_sqlite_conn(self) -> sqlite3.Connection:
        """Create a local sqlite3 connection with dict-like row factory and foreign keys enabled."""
        db_file = str(DEFAULT_LOCAL_DB)
        if self.db_url and self.db_url.startswith("file:"):
            db_file = self.db_url.replace("file:", "")
        conn = sqlite3.connect(db_file, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    async def init_schema(self) -> None:
        """Executes the DDL from schema.sql."""
        ddl = SCHEMA_FILE.read_text(encoding="utf-8")
        if self._is_turso:
            async with libsql_client.create_client(self.db_url, auth_token=self.auth_token) as client:
                for stmt in ddl.strip().split(";"):
                    s = stmt.strip()
                    if s:
                        await client.execute(s)
        else:
            conn = self.get_sqlite_conn()
            try:
                conn.executescript(ddl)
                conn.commit()
            finally:
                conn.close()

    async def execute(self, query: str, params: Optional[Union[List[Any], Dict[str, Any], tuple]] = None) -> Any:
        """Execute a write statement (INSERT, UPDATE, DELETE)."""
        if params is None:
            params = []
        if self._is_turso:
            async with libsql_client.create_client(self.db_url, auth_token=self.auth_token) as client:
                return await client.execute(query, params)
        else:
            conn = self.get_sqlite_conn()
            try:
                cursor = conn.cursor()
                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount
            finally:
                conn.close()

    async def execute_batch(self, statements: List[tuple]) -> None:
        """Execute multiple (query, params) statements in a transaction."""
        if self._is_turso:
            async with libsql_client.create_client(self.db_url, auth_token=self.auth_token) as client:
                batch_stmts = [
                    libsql_client.Statement(q, list(p) if isinstance(p, (list, tuple)) else p)
                    for q, p in statements
                ]
                await client.batch(batch_stmts)
        else:
            conn = self.get_sqlite_conn()
            try:
                cursor = conn.cursor()
                for q, p in statements:
                    cursor.execute(q, p)
                conn.commit()
            finally:
                conn.close()

    async def fetch_all(self, query: str, params: Optional[Union[List[Any], Dict[str, Any], tuple]] = None) -> List[Dict[str, Any]]:
        """Execute a SELECT query and return rows as list of dictionaries."""
        if params is None:
            params = []
        if self._is_turso:
            async with libsql_client.create_client(self.db_url, auth_token=self.auth_token) as client:
                rs = await client.execute(query, params)
                cols = rs.columns
                return [dict(zip(cols, row)) for row in rs.rows]
        else:
            conn = self.get_sqlite_conn()
            try:
                cursor = conn.cursor()
                cursor.execute(query, params)
                rows = cursor.fetchall()
                return [dict(r) for r in rows]
            finally:
                conn.close()

    async def fetch_one(self, query: str, params: Optional[Union[List[Any], Dict[str, Any], tuple]] = None) -> Optional[Dict[str, Any]]:
        """Execute a SELECT query and return a single dictionary row, or None."""
        rows = await self.fetch_all(query, params)
        return rows[0] if rows else None

# Singleton instance
db = Database()

