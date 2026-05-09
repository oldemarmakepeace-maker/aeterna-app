"""
AETERNA Backend — Main Entry Point.
FastAPI-приложение с CORS, подключением роутеров и health-check.
"""

import sys

# ВАЖНО: устанавливаем до любых asyncio-импортов
if sys.platform == "win32":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, tasks, calendar, analytics, categories, ai


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Lifecycle: startup / shutdown."""
    # Startup
    print("AETERNA Backend starting...")
    print(f"   Database: {settings.database_url[:40]}...")
    print(f"   Supabase: {settings.supabase_url}")
    yield
    # Shutdown
    print("AETERNA Backend shutting down...")


app = FastAPI(
    title="AETERNA API",
    description="Премиальный ИИ-ассистент по управлению жизнью для предпринимателей.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Dev: разрешаем все origins
    allow_credentials=False,   # False при allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(calendar.router)
app.include_router(analytics.router)
app.include_router(categories.router)
app.include_router(ai.router)


# ── Health Check ──────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """Проверка работоспособности сервера."""
    return {"status": "healthy", "service": "aeterna-api", "version": "0.1.0"}
