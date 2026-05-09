"""
AETERNA Schema — Task.
Валидация входящих данных и формат ответа API для задач.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.types import TaskType, TaskStatus, TaskRecurrence, TaskImportance


class TaskCreate(BaseModel):
    """Создание новой задачи."""
    title: str
    description: str | None = None
    task_type: TaskType
    category: str
    due_date: datetime | None = None
    recurrence: TaskRecurrence = TaskRecurrence.NONE
    importance: TaskImportance = TaskImportance.NONE


class TaskUpdate(BaseModel):
    """Частичное обновление задачи. Смена status → триггер XP."""
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    due_date: datetime | None = None
    recurrence: TaskRecurrence | None = None
    importance: TaskImportance | None = None


class TaskResponse(BaseModel):
    """Ответ API с полной информацией о задаче."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: str | None
    task_type: TaskType
    category: str
    status: TaskStatus
    due_date: datetime | None
    completed_at: datetime | None
    streak_count: int
    created_at: datetime
    recurrence: TaskRecurrence
    importance: TaskImportance
