"""
AETERNA Router — Calendar Events.
CRUD событий через Supabase REST API.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import SupabaseClient, get_db
from app.routers.auth import get_current_user
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse

router = APIRouter(prefix="/api/v1/events", tags=["calendar"])


def _row_to_event(row: dict) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row["title"],
        "description": row.get("description"),
        "starts_at": row.get("starts_at"),
        "ends_at": row.get("ends_at"),
        "is_hard_block": row.get("is_hard_block", False),
        "status": row.get("status", "scheduled"),
        "created_at": row.get("created_at"),
    }


@router.post("", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: CalendarEventCreate,
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> dict:
    payload = {
        "user_id": user["id"],
        "title": data.title,
        "is_hard_block": data.is_hard_block,
        "status": "scheduled",
    }
    if data.description:
        payload["description"] = data.description
    if data.starts_at:
        payload["starts_at"] = data.starts_at.isoformat()
    if data.ends_at:
        payload["ends_at"] = data.ends_at.isoformat()

    row = await db.insert("calendar_events", payload)
    return _row_to_event(row)


@router.get("", response_model=list[CalendarEventResponse])
async def get_events(
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    is_hard_block: bool | None = Query(None),
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> list[dict]:
    filters: dict = {"user_id": f"eq.{user['id']}"}
    if is_hard_block is not None:
        filters["is_hard_block"] = f"eq.{str(is_hard_block).lower()}"
    if start_date:
        filters["starts_at"] = f"gte.{start_date.isoformat()}"
    if end_date:
        filters["ends_at"] = f"lte.{end_date.isoformat()}"

    rows = await db.select("calendar_events", filters=filters, order="starts_at.asc")
    return [_row_to_event(r) for r in rows]


@router.patch("/{event_id}", response_model=CalendarEventResponse)
async def update_event(
    event_id: uuid.UUID,
    data: CalendarEventUpdate,
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> dict:
    row = await db.select_one("calendar_events", {"id": str(event_id)})
    if row is None or row["user_id"] != user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    update_payload: dict = {}
    if data.title is not None:
        update_payload["title"] = data.title
    if data.status is not None:
        update_payload["status"] = data.status
    if data.starts_at is not None:
        update_payload["starts_at"] = data.starts_at.isoformat()
    if data.ends_at is not None:
        update_payload["ends_at"] = data.ends_at.isoformat()

    updated = None
    if update_payload:
        updated = await db.update("calendar_events", {"id": str(event_id)}, update_payload)

    return _row_to_event(updated or row)
