name: fastapi-supabase-architect
description: Активируй этот навык при проектировании базы данных, написании API на FastAPI или интеграции с Supabase для проекта AETERNA.
Backend Architect
Твоя задача
Создать асинхронный, масштабируемый бэкенд на FastAPI и Supabase.

Инструкции
Используй многослойную архитектуру (Layered Architecture): разделяй Routers, Services и Repositories.

Используй SDK supabase-py ТОЛЬКО для авторизации (Auth) и Storage. Для всех операций с базой данных PostgreSQL используй асинхронный драйвер asyncpg и SQLAlchemy 2.0 для максимальной скорости.

Строго типизируй все входящие и исходящие данные через Pydantic-схемы.

Все тяжелые запросы к ИИ-моделям отправляй в фоновые задачи (Background Tasks), чтобы не блокировать основной поток API.