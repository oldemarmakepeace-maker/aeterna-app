"""
AETERNA Schema — AI.
Схемы для NLP-парсинга намерений пользователя.
"""

from pydantic import BaseModel, Field
from app.types import TaskType, TaskImportance

class IntentParseRequest(BaseModel):
    """Запрос на парсинг текста."""
    text: str = Field(..., description="Текст сообщения пользователя")

class IntentParams(BaseModel):
    """Параметры извлеченного намерения."""
    title: str | None = None
    type: TaskType | None = None
    importance: TaskImportance | None = None
    date: str | None = None
    category: str | None = None

class IntentParseResponse(BaseModel):
    """Ответ с извлеченным действием и параметрами."""
    action: str = Field(..., description="Тип действия (например, create_task, set_reminder)")
    params: IntentParams
