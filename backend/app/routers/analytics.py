"""
AETERNA Router — Analytics.
Эндпоинты аналитики через Supabase REST API.
"""

import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query

from app.database import SupabaseClient, get_db
from app.routers.auth import get_current_user
from app.schemas.xp import ProductivityIndex, CategoryAxis, XPTransactionResponse

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

DECAY_RATE = 0.05
DECAY_FLOOR = 5.0
# Default fallback when user has no categories yet
DEFAULT_LIFE_CATEGORIES = ["work", "health", "relationships", "recreation", "finance", "growth"]

RANK_THRESHOLDS = [
    (5000, "Элита"),
    (2000, "Стратегический"),
    (500, "Тактический"),
    (0, "Операционный"),
]


def _determine_rank(total_xp: int) -> str:
    for threshold, rank in RANK_THRESHOLDS:
        if total_xp >= threshold:
            return rank
    return "Операционный"


def _calculate_decay(base_value: float, last_activity_at: datetime | None) -> float:
    if last_activity_at is None:
        return DECAY_FLOOR
    now = datetime.now(timezone.utc)
    if last_activity_at.tzinfo is None:
        last_activity_at = last_activity_at.replace(tzinfo=timezone.utc)
    days_inactive = max((now - last_activity_at).total_seconds() / 86400, 0)
    decayed = base_value * math.exp(-DECAY_RATE * days_inactive)
    return max(decayed, DECAY_FLOOR)


@router.get(
    "/productivity-index",
    response_model=ProductivityIndex,
    summary="Индекс Продуктивности",
)
async def get_productivity_index(
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> dict:
    """Вычисляет радар + XP + ранг по динамическим категориям пользователя."""
    # Загружаем категории пользователя
    cat_rows = await db.select(
        "user_categories",
        filters={"user_id": f"eq.{user['id']}"},
        order="created_at.asc",
    )
    life_categories = [r["slug"] for r in cat_rows] if cat_rows else DEFAULT_LIFE_CATEGORIES

    # Получить все XP-транзакции пользователя
    txns = await db.select(
        "xp_transactions",
        filters={"user_id": f"eq.{user['id']}"},
        columns="category,amount,created_at",
    )

    xp_by_cat: dict[str, int] = {c: 0 for c in life_categories}
    last_activity: dict[str, datetime | None] = {c: None for c in life_categories}

    for txn in txns:
        cat = txn.get("category")
        if cat not in life_categories:
            continue
        amount = txn.get("amount", 0)
        if amount > 0:
            xp_by_cat[cat] = xp_by_cat.get(cat, 0) + amount
            raw_date = txn.get("created_at")
            if raw_date:
                try:
                    if isinstance(raw_date, str):
                        dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                    else:
                        dt = raw_date
                    prev = last_activity.get(cat)
                    if prev is None or dt > prev:
                        last_activity[cat] = dt
                except Exception:
                    pass

    axes = []
    for cat in life_categories:
        raw_xp = xp_by_cat.get(cat, 0)
        if raw_xp <= 0:
            base_value = DECAY_FLOOR
        else:
            base_value = min(100.0, 20.0 * math.log10(raw_xp + 1))
        decayed = _calculate_decay(base_value, last_activity.get(cat))
        axes.append(CategoryAxis(
            category=cat,
            value=round(decayed, 1),
            last_activity_at=last_activity.get(cat),
        ))

    total_xp = user.get("total_xp", 0)
    rank = _determine_rank(total_xp)

    return ProductivityIndex(
        axes=axes,
        total_xp=total_xp,
        rank=rank,
        streak_multiplier=1.0,
    )


@router.get(
    "/xp-history",
    response_model=list[XPTransactionResponse],
    summary="Лог XP-транзакций",
)
async def get_xp_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> list[dict]:
    """Лог всех начислений и списаний XP пользователя."""
    rows = await db.select(
        "xp_transactions",
        filters={"user_id": f"eq.{user['id']}"},
        order="created_at.desc",
        limit=limit,
        offset=offset,
    )
    return rows
