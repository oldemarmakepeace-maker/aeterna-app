"""
AETERNA Router — Auth.
Авторизация через Supabase Auth. JWT-верификация для защищённых эндпоинтов.
"""

import uuid
from typing import Any

import time
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Header
from jose import jwt, JWTError, jwk

from app.config import settings
from app.database import SupabaseClient, get_db
from app.schemas.user import UserResponse

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


# ── JWT Caching & JWKS ────────────────────────────────────────

_jwks_cache: dict | None = None
_jwks_last_fetched: float = 0
JWKS_CACHE_TTL = 3600  # 1 час


async def get_jwks() -> dict:
    """Загружает и кеширует публичные ключи Supabase."""
    global _jwks_cache, _jwks_last_fetched
    now = time.time()
    if _jwks_cache is None or (now - _jwks_last_fetched) > JWKS_CACHE_TTL:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(settings.supabase_jwks_url)
                resp.raise_for_status()
                _jwks_cache = resp.json()
                _jwks_last_fetched = now
        except Exception as e:
            # Если не удалось загрузить, используем старый кеш или прокидываем ошибку
            if _jwks_cache:
                return _jwks_cache
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Не удалось получить ключи Supabase: {e}",
            )
    return _jwks_cache


# ── Модель пользователя (без SQLAlchemy) ─────────────────────

def _row_to_user(row: dict) -> dict:
    """Конвертирует строку БД в dict-пользователя."""
    return {
        "id": row["id"],
        "email": row["email"],
        "display_name": row.get("display_name"),
        "current_rank": row.get("current_rank", "Операционный"),
        "total_xp": row.get("total_xp", 0),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


# ── JWT-верификация (Supabase) ────────────────────────────────

async def get_current_user(
    authorization: str = Header(..., description="Bearer <supabase_jwt>"),
    db: SupabaseClient = Depends(get_db),
) -> dict:
    """
    Dependency: извлекает пользователя из Supabase JWT.
    Используется во всех защищённых эндпоинтах.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный формат токена. Ожидается: Bearer <token>",
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        # Извлекаем заголовок, чтобы понять алгоритм и kid
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        kid = header.get("kid")

        if alg == "HS256":
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        elif alg == "ES256":
            jwks = await get_jwks()
            key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)

            if not key_data:
                raise JWTError(f"Ключ с kid={kid} не найден в JWKS")
            
            # В jose для ES256 лучше передавать объект ключа
            key_obj = jwk.construct(key_data)
            payload = jwt.decode(
                token,
                key_obj,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            raise JWTError(f"Неподдерживаемый алгоритм: {alg}")

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Невалидный JWT: {e}",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT не содержит sub (user_id)",
        )

    # Найти пользователя в БД
    row = await db.select_one("users", {"id": user_id})
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден в БД. Необходима регистрация.",
        )

    return _row_to_user(row)


# ── Endpoints ─────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=UserResponse,
    summary="Получить профиль по JWT",
)
async def login_user(user: dict = Depends(get_current_user)) -> dict:
    """Возвращает профиль текущего пользователя (валидация JWT)."""
    return user

