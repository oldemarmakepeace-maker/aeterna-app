"""
AETERNA Router — User Categories.
CRUD пользовательских категорий через Supabase REST API.
Системные 6 категорий возвращаются как дефолт, если у пользователя нет своих.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.database import SupabaseClient, get_db
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])

# ── Default categories (fallback) ────────────────────────────
DEFAULT_CATEGORIES = [
    {"slug": "work",          "label": "Работа",    "icon": "💼"},
    {"slug": "health",        "label": "Здоровье",  "icon": "🏋️"},
    {"slug": "relationships", "label": "Отношения", "icon": "🤝"},
    {"slug": "recreation",    "label": "Отдых",     "icon": "🌿"},
    {"slug": "finance",       "label": "Финансы",   "icon": "📊"},
    {"slug": "growth",        "label": "Рост",      "icon": "🚀"},
]


class CategoryCreate(BaseModel):
    slug: str = Field(..., min_length=1, max_length=64, pattern=r"^[a-z0-9_-]+$")
    label: str = Field(..., min_length=1, max_length=100)
    icon: str = Field(default="📋", max_length=10)


class CategoryResponse(BaseModel):
    slug: str
    label: str
    icon: str


@router.get("", response_model=list[CategoryResponse])
async def get_categories(
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> list[dict]:
    """
    Список категорий пользователя.
    Если нет ни одной — возвращает 6 системных дефолтных и создаёт их.
    """
    rows = await db.select(
        "user_categories",
        filters={"user_id": f"eq.{user['id']}"},
        order="created_at.asc",
    )

    if not rows:
        # Первый запрос — инициализируем дефолтные
        for cat in DEFAULT_CATEGORIES:
            try:
                await db.insert("user_categories", {
                    "user_id": user["id"],
                    "slug": cat["slug"],
                    "label": cat["label"],
                    "icon": cat["icon"],
                })
            except Exception:
                pass  # уже существует (UNIQUE constraint)

        rows = await db.select(
            "user_categories",
            filters={"user_id": f"eq.{user['id']}"},
            order="created_at.asc",
        )

    return [{"slug": r["slug"], "label": r["label"], "icon": r["icon"]} for r in rows]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> dict:
    """Создать новую пользовательскую категорию."""
    # Проверяем дубликат
    existing = await db.select(
        "user_categories",
        filters={"user_id": f"eq.{user['id']}", "slug": f"eq.{data.slug}"},
        limit=1,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Категория с slug '{data.slug}' уже существует",
        )

    row = await db.insert("user_categories", {
        "user_id": user["id"],
        "slug": data.slug,
        "label": data.label,
        "icon": data.icon,
    })
    return {"slug": row["slug"], "label": row["label"], "icon": row["icon"]}


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    slug: str,
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_db),
) -> None:
    """Удалить категорию пользователя."""
    row = await db.select(
        "user_categories",
        filters={"user_id": f"eq.{user['id']}", "slug": f"eq.{slug}"},
        limit=1,
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена",
        )

    await db.delete("user_categories", {"user_id": user["id"], "slug": slug})
