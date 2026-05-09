"""
AETERNA Schema — Calendar Event.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator

from app.types import LifeCategory


class CalendarEventCreate(BaseModel):
    """Создание события. end_time должен быть позже start_time."""
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    is_hard_block: bool = False
    category: LifeCategory

    @model_validator(mode="after")
    def validate_times(self) -> "CalendarEventCreate":
        if self.end_time <= self.start_time:
            raise ValueError("end_time должен быть позже start_time")
        return self


class CalendarEventUpdate(BaseModel):
    """Частичное обновление события."""
    title: str | None = None
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: str | None = None  # scheduled | completed | missed


class CalendarEventResponse(BaseModel):
    """Ответ API."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: str | None
    start_time: datetime
    end_time: datetime
    is_hard_block: bool
    category: LifeCategory
    status: str
    xp_awarded: int
    created_at: datetime
