"""AETERNA Backend — Supabase REST Client.
Использует Supabase PostgREST API для работы с БД через HTTP.
"""

from collections.abc import AsyncIterator
from typing import Any

import httpx
from app.config import settings


class SupabaseClient:
    """HTTP-клиент для работы с Supabase REST API (PostgREST)."""

    def __init__(self):
        self.base_url = f"{settings.supabase_url}/rest/v1"
        self.headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self.base_url,
            headers=self.headers,
            timeout=30.0,
        )

    async def select(
        self,
        table: str,
        filters: dict[str, Any] | None = None,
        columns: str = "*",
        order: str | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict]:
        """SELECT из таблицы с фильтрами."""
        params: dict[str, Any] = {"select": columns}
        if filters:
            params.update(filters)
        if order:
            params["order"] = order
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset

        async with self._client() as c:
            resp = await c.get(f"/{table}", params=params)
            resp.raise_for_status()
            return resp.json()

    async def insert(self, table: str, data: dict) -> dict:
        """INSERT в таблицу."""
        async with self._client() as c:
            resp = await c.post(f"/{table}", json=data)
            resp.raise_for_status()
            result = resp.json()
            return result[0] if isinstance(result, list) else result

    async def update(self, table: str, filters: dict[str, Any], data: dict) -> dict | None:
        """UPDATE записей с фильтром."""
        params = {k: f"eq.{v}" for k, v in filters.items()}
        async with self._client() as c:
            resp = await c.patch(f"/{table}", params=params, json=data)
            resp.raise_for_status()
            result = resp.json()
            return result[0] if isinstance(result, list) and result else None

    async def delete(self, table: str, filters: dict[str, Any]) -> bool:
        """DELETE записей с фильтром."""
        params = {k: f"eq.{v}" for k, v in filters.items()}
        async with self._client() as c:
            resp = await c.delete(f"/{table}", params=params)
            resp.raise_for_status()
            return resp.status_code in (200, 204)

    async def select_one(
        self, table: str, filters: dict[str, Any], columns: str = "*"
    ) -> dict | None:
        """SELECT одной записи."""
        rows = await self.select(table, filters={k: f"eq.{v}" for k, v in filters.items()}, columns=columns, limit=1)
        return rows[0] if rows else None


# Глобальный клиент
supabase = SupabaseClient()


# ── Dependency для FastAPI ────────────────────────────────────

async def get_db() -> AsyncIterator[SupabaseClient]:
    """FastAPI dependency: возвращает Supabase HTTP-клиент."""
    yield supabase
