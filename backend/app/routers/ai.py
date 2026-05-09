"""
AETERNA Router — AI.
Интеграция с Google Gemini для извлечения намерений из текста.
"""

import json
from fastapi import APIRouter, Depends, HTTPException, status
import google.generativeai as genai

from app.config import settings
from app.routers.auth import get_current_user
from app.schemas.ai import IntentParseRequest, IntentParseResponse

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

# Настройка Gemini
_gemini_model: genai.GenerativeModel | None = None

if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
    _gemini_model = genai.GenerativeModel("gemini-1.5-flash")

SYSTEM_PROMPT = """
Ты — AI-ассистент системы AETERNA. Твоя задача — извлечь намерение пользователя из текста.
Верни ответ СТРОГО в формате JSON.

Возможные action:
- create_task: создание новой задачи.

Параметры (params):
- title: краткое название задачи.
- type: один из [routine, strategic, hard_block].
- importance: один из [none, low, medium, high].
- date: дата в формате ISO (YYYY-MM-DD) или null.
- category: одна из [work, health, relationships, recreation, finance, growth] или null.

Пример:
Текст: "Запланируй важную стратегическую задачу по работе на завтра: подготовить отчет"
Ответ:
{
  "action": "create_task",
  "params": {
    "title": "Подготовить отчет",
    "type": "strategic",
    "importance": "high",
    "date": "2026-05-10",
    "category": "work"
  }
}
"""

@router.post(
    "/parse-intent",
    response_model=IntentParseResponse,
    summary="Извлечь намерение из текста",
)
async def parse_intent(
    data: IntentParseRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    """Использует Google Gemini для NLP-парсинга текста пользователя."""
    if _gemini_model is None:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Gemini API key not configured",
        )

    try:
        prompt = f"{SYSTEM_PROMPT}\n\nТекст пользователя: \"{data.text}\"\nОтвет:"
        response = _gemini_model.generate_content(prompt)

        # Очистка от markdown-блоков, если они есть
        text_response = response.text.strip()
        if text_response.startswith("```json"):
            text_response = text_response[7:-3].strip()
        elif text_response.startswith("```"):
            text_response = text_response[3:-3].strip()

        result: dict = json.loads(text_response)
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Gemini вернул невалидный JSON: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing intent: {e}",
        )
