"""
AETERNA Schema — XP & Analytics.
ProductivityIndex — модель для 6-осевой радарной диаграммы.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class XPTransactionResponse(BaseModel):
    """Одна транзакция в логе XP."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    amount: int
    reason: str
    source_type: str
    source_id: uuid.UUID | None
    category: str
    created_at: datetime


class CategoryAxis(BaseModel):
    """Значение одной оси радарной диаграммы."""
    category: str
    value: float = Field(ge=0.0, le=100.0, description="Индекс 0-100")
    last_activity_at: datetime | None = None


class ProductivityIndex(BaseModel):
    """
    Индекс продуктивности — данные для 6-осевой радарной диаграммы.
    Каждая ось: 0.0 — 100.0, с учётом decay.
    """
    axes: list[CategoryAxis]
    total_xp: int = Field(ge=0)
    rank: str = Field(description="Операционный | Тактический | Стратегический | Элита")
    streak_multiplier: float = Field(ge=1.0, le=4.0)
