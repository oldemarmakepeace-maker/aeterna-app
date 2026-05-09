"""
AETERNA Backend — Analytics Router Tests.
Тесты для Decay-функции и ProductivityIndex.
"""

import math
from datetime import datetime, timezone, timedelta

import pytest
from fastapi import status
from fastapi.testclient import TestClient


# ── Decay Function Unit Tests ────────────────────────────────

class TestDecayFunction:
    """Тесты для _calculate_decay и формулы V(t) = V₀ × e^(−λt)."""

    def test_decay_no_activity(self):
        """Без активности значение должно быть DECAY_FLOOR = 5.0."""
        from app.routers.analytics import _calculate_decay, DECAY_FLOOR

        result = _calculate_decay(50.0, None)
        assert result == DECAY_FLOOR

    def test_decay_zero_days(self):
        """При активности сегодня — значение не падает."""
        from app.routers.analytics import _calculate_decay

        now = datetime.now(timezone.utc)
        result = _calculate_decay(80.0, now)
        assert result == pytest.approx(80.0, abs=1.0)

    def test_decay_after_10_days(self):
        """V(10) = V₀ × e^(−0.05×10) = V₀ × 0.6065."""
        from app.routers.analytics import _calculate_decay, DECAY_RATE

        last = datetime.now(timezone.utc) - timedelta(days=10)
        result = _calculate_decay(100.0, last)
        expected = 100.0 * math.exp(-DECAY_RATE * 10)
        assert result == pytest.approx(expected, abs=0.5)

    def test_decay_after_30_days(self):
        """V(30) = V₀ × e^(−0.05×30) = V₀ × 0.2231."""
        from app.routers.analytics import _calculate_decay, DECAY_RATE

        last = datetime.now(timezone.utc) - timedelta(days=30)
        result = _calculate_decay(100.0, last)
        expected = 100.0 * math.exp(-DECAY_RATE * 30)
        assert result == pytest.approx(expected, abs=0.5)

    def test_decay_floor_enforced(self):
        """Значение не падает ниже 5.0 (DECAY_FLOOR)."""
        from app.routers.analytics import _calculate_decay, DECAY_FLOOR

        # 365 дней без активности
        last = datetime.now(timezone.utc) - timedelta(days=365)
        result = _calculate_decay(10.0, last)
        assert result >= DECAY_FLOOR

    def test_decay_rate_constant(self):
        """λ должна быть 0.05 по спецификации."""
        from app.routers.analytics import DECAY_RATE

        assert DECAY_RATE == 0.05

    def test_decay_floor_constant(self):
        """Минимум должен быть 5.0 по спецификации."""
        from app.routers.analytics import DECAY_FLOOR

        assert DECAY_FLOOR == 5.0


# ── Rank Determination ────────────────────────────────────────

class TestRankDetermination:
    """Проверка определения ранга по XP."""

    def test_ranks(self):
        from app.routers.analytics import _determine_rank

        assert _determine_rank(0) == "Операционный"
        assert _determine_rank(499) == "Операционный"
        assert _determine_rank(500) == "Тактический"
        assert _determine_rank(1999) == "Тактический"
        assert _determine_rank(2000) == "Стратегический"
        assert _determine_rank(4999) == "Стратегический"
        assert _determine_rank(5000) == "Элита"


# ── Productivity Index Endpoint ───────────────────────────────

class TestProductivityIndex:
    """GET /api/v1/analytics/productivity-index"""

    def test_returns_6_axes(self, client: TestClient):
        """По умолчанию должно быть 6 осей."""
        resp = client.get("/api/v1/analytics/productivity-index")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert len(data["axes"]) == 6

    def test_default_axes_categories(self, client: TestClient):
        """Дефолтные категории: work, health, relationships, recreation, finance, growth."""
        resp = client.get("/api/v1/analytics/productivity-index")
        data = resp.json()
        categories = [a["category"] for a in data["axes"]]
        expected = ["work", "health", "relationships", "recreation", "finance", "growth"]
        assert categories == expected

    def test_axes_values_within_range(self, client: TestClient):
        """Все значения осей должны быть от 0 до 100."""
        resp = client.get("/api/v1/analytics/productivity-index")
        data = resp.json()
        for axis in data["axes"]:
            assert 0.0 <= axis["value"] <= 100.0

    def test_total_xp_non_negative(self, client: TestClient):
        """total_xp не может быть отрицательным."""
        resp = client.get("/api/v1/analytics/productivity-index")
        data = resp.json()
        assert data["total_xp"] >= 0

    def test_rank_is_valid(self, client: TestClient):
        """Ранг должен быть одним из 4 допустимых значений."""
        resp = client.get("/api/v1/analytics/productivity-index")
        data = resp.json()
        valid_ranks = {"Операционный", "Тактический", "Стратегический", "Элита"}
        assert data["rank"] in valid_ranks

    def test_streak_multiplier_range(self, client: TestClient):
        """streak_multiplier: 1.0 — 4.0."""
        resp = client.get("/api/v1/analytics/productivity-index")
        data = resp.json()
        assert 1.0 <= data["streak_multiplier"] <= 4.0


# ── XP History Endpoint ──────────────────────────────────────

class TestXpHistory:
    """GET /api/v1/analytics/xp-history"""

    def test_empty_history(self, client: TestClient):
        resp = client.get("/api/v1/analytics/xp-history")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json() == []
