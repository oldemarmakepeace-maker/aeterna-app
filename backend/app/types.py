"""
AETERNA — Shared Types.
Enum для использования в схемах и роутерах.
"""

from enum import Enum


class TaskType(str, Enum):
    ROUTINE = "routine"
    STRATEGIC = "strategic"
    HARD_BLOCK = "hard_block"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class TaskRecurrence(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class TaskImportance(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class LifeCategory(str, Enum):
    WORK = "work"
    HEALTH = "health"
    RELATIONSHIPS = "relationships"
    RECREATION = "recreation"
    FINANCE = "finance"
    GROWTH = "growth"
