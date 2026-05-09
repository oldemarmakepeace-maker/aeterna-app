"""
AETERNA Router — Tasks.
CRUD задач через Supabase REST API. XP начисляется при смене статуса.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import SupabaseClient, get_db
from app.routers.auth import get_current_user
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])

# ── XP таблица ───────────────────────────────────────────────
XP_REWARDS = {"routine": 5, "strategic": 20, "hard_block": 50}
XP_PENALTIES = {"routine": 0, "strategic": -15, "hard_block": -100}


def _row_to_task(row: dict) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row["title"],
        "description": row.get("description"),
        "task_type": row["task_type"],
        "category": row["category"],
        "status": row.get("status", "pending"),
        "due_date": row.get("due_date"),
        "completed_at": row.get("completed_at"),
        "streak_count": row.get("streak_count", 0),
        "created_at": row.get("created_at"),
        "recurrence": row.get("recurrence", "none"),
        "importance": row.get("importance", "none"),
    }


async def _award_xp(
    db: SupabaseClient,
    user: dict,
    amount: int,
    reason: str,
    category: str,
    source_id: str | None = None,
):
    """Начислить XP пользователю."""
    if amount == 0:
        return

    # Записать транзакцию
    await db.insert("xp_transactions", {
        "user_id": user["id"],
        "amount": amount,
        "reason": reason,
        "source_type": "task",
        "source_id": source_id,
        "category": category,
    })

    # Обновить total_xp пользователя
    new_xp = max(user.get("total_xp", 0) + amount, 0)
    rank = _determine_rank(new_xp)
    await db.update("users", {"id": user["id"]}, {
        "total_xp": new_xp,
        "current_rank": rank,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })


def _determine_rank(total_xp: int) -> str:
    if total_xp >= 5000:
        return "Элита"
    if total_xp >= 2000:
        return "Стратегический"
    if total_xp >= 500:
        return "Тактический"
    return "Операционный"


def _streak_multiplier(streak: int) -> float:
    return 1.0 + 0.1 * min(streak, 30)


# ── Endpoints ─────────────────────────────────────────────────

@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать задачу",
)
async def create_task(
    data: TaskCreate,
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> dict:
    """Создать новую задачу для текущего пользователя."""
    payload = {
        "user_id": user["id"],
        "title": data.title,
        "task_type": data.task_type,
        "category": data.category,
        "status": "pending",
        "streak_count": 0,
        "recurrence": data.recurrence,
        "importance": data.importance,
    }
    if data.description:
        payload["description"] = data.description
    if data.due_date:
        payload["due_date"] = data.due_date.isoformat()

    row = await db.insert("tasks", payload)
    return _row_to_task(row)


@router.get(
    "",
    response_model=list[TaskResponse],
    summary="Список задач",
)
async def get_tasks(
    status_filter: str | None = Query(None, alias="status"),
    category: str | None = Query(None),
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> list[dict]:
    """Список задач текущего пользователя с фильтрами."""
    filters: dict = {"user_id": f"eq.{user['id']}"}
    if status_filter:
        filters["status"] = f"eq.{status_filter}"
    if category:
        filters["category"] = f"eq.{category}"

    rows = await db.select(
        "tasks",
        filters=filters,
        order="created_at.desc",
    )
    return [_row_to_task(r) for r in rows]


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Обновить задачу",
)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> dict:
    """Обновить задачу. Смена статуса → автоматический триггер XP."""
    # Найти задачу
    row = await db.select_one("tasks", {"id": str(task_id)})
    if row is None or row["user_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена",
        )

    old_status = row.get("status")
    update_payload: dict = {}

    if data.status is not None:
        update_payload["status"] = data.status
        if data.status == "completed":
            update_payload["completed_at"] = datetime.now(timezone.utc).isoformat()
            update_payload["streak_count"] = row.get("streak_count", 0) + 1
    if data.title is not None:
        update_payload["title"] = data.title
    if data.description is not None:
        update_payload["description"] = data.description
    if data.due_date is not None:
        update_payload["due_date"] = data.due_date.isoformat()
    if data.recurrence is not None:
        update_payload["recurrence"] = data.recurrence
    if data.importance is not None:
        update_payload["importance"] = data.importance

    if update_payload:
        updated = await db.update("tasks", {"id": str(task_id)}, update_payload)
        if updated:
            row = updated

    # XP при смене статуса
    if data.status and data.status != old_status:
        task_type = row.get("task_type", "routine")
        streak = update_payload.get("streak_count", row.get("streak_count", 0))
        mult = _streak_multiplier(streak)

        if data.status == "completed":
            xp = int(XP_REWARDS.get(task_type, 5) * mult)
            await _award_xp(db, user, xp, "task_completed", row["category"], str(task_id))
        elif data.status in ("failed", "skipped"):
            penalty = XP_PENALTIES.get(task_type, 0)
            if penalty != 0:
                await _award_xp(db, user, penalty, "task_failed", row["category"], str(task_id))

    # Перечитать актуальную строку
    latest = await db.select_one("tasks", {"id": str(task_id)})
    return _row_to_task(latest or row)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить задачу",
)
async def delete_task(
    task_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> None:
    """Удалить задачу текущего пользователя."""
    row = await db.select_one("tasks", {"id": str(task_id)})
    if row is None or row["user_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена",
        )
    await db.delete("tasks", {"id": str(task_id)})
