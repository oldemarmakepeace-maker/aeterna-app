"""
AETERNA Backend — Task Router Tests.
Тесты для CRUD задач и XP-логики.
"""

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from tests.conftest import FAKE_USER


# ── Helpers ───────────────────────────────────────────────────

def _create_task(client: TestClient, **overrides) -> dict:
    """Создать задачу с дефолтными значениями."""
    payload = {
        "title": "Test Task",
        "task_type": "routine",
        "category": "work",
        **overrides,
    }
    resp = client.post("/api/v1/tasks", json=payload)
    assert resp.status_code == status.HTTP_201_CREATED, resp.text
    return resp.json()


# ── CREATE ────────────────────────────────────────────────────

class TestCreateTask:
    """POST /api/v1/tasks"""

    def test_create_routine(self, client: TestClient):
        data = _create_task(client, title="Утренняя зарядка", task_type="routine", category="health")
        assert data["title"] == "Утренняя зарядка"
        assert data["task_type"] == "routine"
        assert data["category"] == "health"
        assert data["status"] == "pending"
        assert data["streak_count"] == 0

    def test_create_strategic(self, client: TestClient):
        data = _create_task(client, title="Отчёт Q2", task_type="strategic", category="work")
        assert data["task_type"] == "strategic"

    def test_create_hard_block(self, client: TestClient):
        data = _create_task(client, title="Встреча с инвестором", task_type="hard_block", category="finance")
        assert data["task_type"] == "hard_block"

    def test_create_with_importance(self, client: TestClient):
        data = _create_task(client, importance="high")
        assert data["importance"] == "high"

    def test_create_with_recurrence(self, client: TestClient):
        data = _create_task(client, recurrence="daily")
        assert data["recurrence"] == "daily"

    def test_create_with_description(self, client: TestClient):
        data = _create_task(client, description="Подробное описание задачи")
        assert data["description"] == "Подробное описание задачи"

    def test_create_with_due_date(self, client: TestClient):
        data = _create_task(client, due_date="2026-12-31T23:59:00")
        assert data["due_date"] is not None


# ── READ ──────────────────────────────────────────────────────

class TestGetTasks:
    """GET /api/v1/tasks"""

    def test_list_empty(self, client: TestClient):
        resp = client.get("/api/v1/tasks")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json() == []

    def test_list_after_create(self, client: TestClient):
        _create_task(client, title="Task A")
        _create_task(client, title="Task B")
        resp = client.get("/api/v1/tasks")
        assert resp.status_code == status.HTTP_200_OK
        tasks = resp.json()
        assert len(tasks) == 2

    def test_filter_by_status(self, client: TestClient):
        _create_task(client, title="Pending task")
        resp = client.get("/api/v1/tasks", params={"status": "pending"})
        assert resp.status_code == status.HTTP_200_OK
        assert all(t["status"] == "pending" for t in resp.json())

    def test_filter_by_category(self, client: TestClient):
        _create_task(client, title="Work task", category="work")
        _create_task(client, title="Health task", category="health")
        resp = client.get("/api/v1/tasks", params={"category": "work"})
        assert resp.status_code == status.HTTP_200_OK
        tasks = resp.json()
        assert all(t["category"] == "work" for t in tasks)


# ── UPDATE ────────────────────────────────────────────────────

class TestUpdateTask:
    """PATCH /api/v1/tasks/{id}"""

    def test_update_title(self, client: TestClient):
        task = _create_task(client, title="Old Title")
        resp = client.patch(f"/api/v1/tasks/{task['id']}", json={"title": "New Title"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["title"] == "New Title"

    def test_complete_task_increments_streak(self, client: TestClient):
        task = _create_task(client)
        resp = client.patch(
            f"/api/v1/tasks/{task['id']}",
            json={"status": "completed"},
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["status"] == "completed"
        assert data["streak_count"] == 1
        assert data["completed_at"] is not None

    def test_update_nonexistent_task(self, client: TestClient):
        fake_id = "00000000-0000-0000-0000-000000000000"
        resp = client.patch(
            f"/api/v1/tasks/{fake_id}",
            json={"title": "Nope"},
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ── DELETE ────────────────────────────────────────────────────

class TestDeleteTask:
    """DELETE /api/v1/tasks/{id}"""

    def test_delete_task(self, client: TestClient):
        task = _create_task(client)
        resp = client.delete(f"/api/v1/tasks/{task['id']}")
        assert resp.status_code == status.HTTP_204_NO_CONTENT

        # Проверяем что задача удалена
        resp = client.get("/api/v1/tasks")
        assert len(resp.json()) == 0

    def test_delete_nonexistent_task(self, client: TestClient):
        fake_id = "00000000-0000-0000-0000-000000000000"
        resp = client.delete(f"/api/v1/tasks/{fake_id}")
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ── XP Logic ─────────────────────────────────────────────────

class TestXpLogic:
    """Проверка начисления XP при завершении/провале задач."""

    def test_xp_transaction_created_on_complete(self, client: TestClient, mock_db):
        """При завершении задачи должна создаться XP-транзакция."""
        task = _create_task(client, task_type="routine", category="work")

        # Завершаем
        client.patch(f"/api/v1/tasks/{task['id']}", json={"status": "completed"})

        # Проверяем XP-транзакцию
        txns = mock_db._tables.get("xp_transactions", [])
        assert len(txns) >= 1
        last = txns[-1]
        assert last["amount"] > 0
        assert last["reason"] == "task_completed"
        assert last["category"] == "work"

    def test_xp_penalty_on_failed_hard_block(self, client: TestClient, mock_db):
        """Hard block при провале даёт штраф -100 XP."""
        task = _create_task(client, task_type="hard_block", category="finance")

        client.patch(f"/api/v1/tasks/{task['id']}", json={"status": "failed"})

        txns = mock_db._tables.get("xp_transactions", [])
        penalties = [t for t in txns if t["amount"] < 0]
        assert len(penalties) >= 1
        assert penalties[-1]["amount"] == -100

    def test_no_xp_penalty_on_skipped_routine(self, client: TestClient, mock_db):
        """Рутина при пропуске НЕ даёт штрафа (penalty = 0)."""
        task = _create_task(client, task_type="routine", category="health")

        client.patch(f"/api/v1/tasks/{task['id']}", json={"status": "skipped"})

        txns = mock_db._tables.get("xp_transactions", [])
        penalties = [t for t in txns if t["amount"] < 0]
        assert len(penalties) == 0


# ── Streak Multiplier ────────────────────────────────────────

class TestStreakMultiplier:
    """Проверка streak-множителя."""

    def test_streak_multiplier_formula(self):
        """multiplier = 1.0 + 0.1 × min(streak, 30), max = 4.0"""
        from app.routers.tasks import _streak_multiplier

        assert _streak_multiplier(0) == 1.0
        assert _streak_multiplier(1) == pytest.approx(1.1)
        assert _streak_multiplier(10) == pytest.approx(2.0)
        assert _streak_multiplier(30) == pytest.approx(4.0)
        assert _streak_multiplier(50) == pytest.approx(4.0)  # capped at 30

    def test_rank_determination(self):
        """Проверка определения ранга по XP."""
        from app.routers.tasks import _determine_rank

        assert _determine_rank(0) == "Операционный"
        assert _determine_rank(499) == "Операционный"
        assert _determine_rank(500) == "Тактический"
        assert _determine_rank(1999) == "Тактический"
        assert _determine_rank(2000) == "Стратегический"
        assert _determine_rank(4999) == "Стратегический"
        assert _determine_rank(5000) == "Элита"
        assert _determine_rank(99999) == "Элита"
