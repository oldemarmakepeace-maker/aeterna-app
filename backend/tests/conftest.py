"""
AETERNA Backend — Test Fixtures.
Мок-объекты для SupabaseClient и auth dependency.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.database import SupabaseClient, get_db
from app.routers.auth import get_current_user
from app.main import app


# ── Fake User ─────────────────────────────────────────────────

FAKE_USER = {
    "id": str(uuid.uuid4()),
    "email": "test@aeterna.app",
    "display_name": "Test User",
    "current_rank": "Операционный",
    "total_xp": 0,
    "created_at": datetime.now(timezone.utc).isoformat(),
    "updated_at": datetime.now(timezone.utc).isoformat(),
}


# ── Mock SupabaseClient ───────────────────────────────────────

class MockSupabaseClient:
    """In-memory mock для SupabaseClient."""

    def __init__(self) -> None:
        self._tables: dict[str, list[dict]] = {}

    async def select(
        self,
        table: str,
        filters: dict | None = None,
        columns: str = "*",
        order: str | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict]:
        rows = self._tables.get(table, [])
        if filters:
            for key, val in filters.items():
                if isinstance(val, str) and val.startswith("eq."):
                    match_val = val[3:]
                    rows = [r for r in rows if str(r.get(key)) == match_val]
        if limit is not None:
            rows = rows[:limit]
        return rows

    async def insert(self, table: str, data: dict) -> dict:
        if table not in self._tables:
            self._tables[table] = []
        row = {
            "id": data.get("id", str(uuid.uuid4())),
            "created_at": datetime.now(timezone.utc).isoformat(),
            **data,
        }
        self._tables[table].append(row)
        return row

    async def update(self, table: str, filters: dict, data: dict) -> dict | None:
        rows = self._tables.get(table, [])
        for row in rows:
            match = all(str(row.get(k)) == str(v) for k, v in filters.items())
            if match:
                row.update(data)
                return row
        return None

    async def delete(self, table: str, filters: dict) -> bool:
        rows = self._tables.get(table, [])
        before = len(rows)
        self._tables[table] = [
            r for r in rows
            if not all(str(r.get(k)) == str(v) for k, v in filters.items())
        ]
        return len(self._tables[table]) < before

    async def select_one(
        self, table: str, filters: dict, columns: str = "*"
    ) -> dict | None:
        eq_filters = {k: f"eq.{v}" for k, v in filters.items()}
        rows = await self.select(table, filters=eq_filters, limit=1)
        return rows[0] if rows else None


# ── Fixtures ──────────────────────────────────────────────────

@pytest.fixture()
def mock_db() -> MockSupabaseClient:
    """Возвращает чистый мок-клиент для каждого теста."""
    return MockSupabaseClient()


@pytest.fixture()
def client(mock_db: MockSupabaseClient) -> TestClient:
    """
    TestClient с подмененными зависимостями:
    - get_db → MockSupabaseClient
    - get_current_user → FAKE_USER
    """
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
