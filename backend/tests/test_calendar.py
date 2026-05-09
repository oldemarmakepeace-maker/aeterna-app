"""
AETERNA Backend — Calendar Router Tests.
Тесты для CRUD событий.
"""

from fastapi import status
from fastapi.testclient import TestClient


def _create_event(client: TestClient, **overrides) -> dict:
    payload = {
        "title": "Test Event",
        "is_hard_block": False,
        **overrides,
    }
    resp = client.post("/api/v1/events", json=payload)
    assert resp.status_code == status.HTTP_201_CREATED, resp.text
    return resp.json()


class TestCreateEvent:
    """POST /api/v1/events"""

    def test_create_event(self, client: TestClient):
        data = _create_event(client, title="Обед с партнёром")
        assert data["title"] == "Обед с партнёром"
        assert data["status"] == "scheduled"

    def test_create_hard_block_event(self, client: TestClient):
        data = _create_event(client, title="Board Meeting", is_hard_block=True)
        assert data["is_hard_block"] is True


class TestGetEvents:
    """GET /api/v1/events"""

    def test_list_empty(self, client: TestClient):
        resp = client.get("/api/v1/events")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json() == []

    def test_list_after_create(self, client: TestClient):
        _create_event(client, title="Event A")
        _create_event(client, title="Event B")
        resp = client.get("/api/v1/events")
        assert len(resp.json()) == 2


class TestUpdateEvent:
    """PATCH /api/v1/events/{id}"""

    def test_update_title(self, client: TestClient):
        event = _create_event(client, title="Old Title")
        resp = client.patch(f"/api/v1/events/{event['id']}", json={"title": "New Title"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["title"] == "New Title"

    def test_update_nonexistent(self, client: TestClient):
        fake_id = "00000000-0000-0000-0000-000000000000"
        resp = client.patch(f"/api/v1/events/{fake_id}", json={"title": "X"})
        assert resp.status_code == status.HTTP_404_NOT_FOUND
