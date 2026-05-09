# AETERNA Project – Full Implementation Plan

## 📋 Общее описание
Проект **AETERNA** – премиальный PWA‑ассистент для управления жизнью предпринимателя.  
Текущий статус: реализованы базовые бекенд‑эндпоинты, UI‑каркас и дизайн‑токены "Quiet Luxury".  
Отказ от Telegram‑бота требует очистки кода и адаптации AI‑pipeline для прямой работы через веб‑интерфейс.

---

## ✅ Что уже реализовано
| Компонент | Статус |
|---|---|
| Backend (FastAPI, Supabase) | ✅ CRUD задач, XP‑логика, Auth |
| Frontend (Next.js 15, Tailwind, Framer Motion) | ✅ Дизайн‑токены, базовый Dashboard |
| Analytics API | ✅ Decay реализован (λ=0.05, floor=5.0) |
| PWA‑манифест | ✅ Настроен (manifest.json, next-pwa, иконки) |
| AI Intent Extraction | ✅ Gemini 1.5 Flash |
| Тесты и CI | ✅ pytest + GitHub Actions, Vitest для Frontend |
| Telegram‑бот | ✅ Удалён (проект очищен) |

---

## 📦 План задач
| # | Задача | Описание | Приоритет | Модель ИИ | Промпт | Ожидаемый результат |
|---|---|---|---|---|---|---|
| **1** | **Очистка проекта** | Удалить `telegram-bot/`, убрать все упоминания Telegram из кода и документации. | Высокий | **Sonnet 4.6** | `Удали директорию telegram-bot. Проверь AGENTS.md и все .py/.ts файлы, убери упоминания Telegram и aiogram. Убедись, что .env не содержит ключей бота.` | ✅ Директория удалена, `AGENTS.md` обновлён. |
| **2** | **AI Intent Extraction (Backend)** | Добавить роутер `/api/v1/ai/parse-intent` → использует Google Gemini для извлечения намерений из текста. | Высокий | **Gemini 3.1 High** | `Создай файл backend/app/routers/ai.py...` | ✅ Реализовано эндпоинт и логика парсинга. |
| **3** | **Расчёт Decay в аналитике** | Реализовать экспоненциальное затухание XP по каждой из 6 осей, минимум 5.0. | Средний | **Opus 4.6** | `Обнови backend/app/routers/analytics.py. Добавь функцию calculate_decay(v0, days, lambda=0.05) → max(v0 * exp(-lambda*days), 5.0). Применяй её к каждому показателю в ProductivityIndex.` | ✅ Decay реализован в `_calculate_decay`, применяется к каждой оси. |
| **4** | **Frontend – подключение к API** | Интегрировать Dashboard с новыми эндпоинтами, добавить SWR/React‑Query, анимации Framer Motion (spring). | Высокий | **Sonnet 4.6** | `...` | ✅ SWR подключён, анимации spring обновлены. |
| **5** | **PWA‑конфигурация** | Добавить `manifest.json`, иконки, настроить Service Worker через `next-pwa`. | Средний | **GPT 120** | `Создай public/manifest.json с цветами из AGENTS.md (background:#0A0A0A, theme_color:#B87333). Добавь next-pwa в next.config.ts и скрипт generate-sw.js. Убедись, что приложение можно установить на iOS/Android и работает офлайн для списка задач.` | ✅ Приложение полностью PWA‑совместимо. |
| **6** | **Тесты и CI** | Добавить unit‑тесты для роутеров и UI‑компонентов, настроить GitHub Actions. | Низкий | **Opus 4.6** | `Создай tests/backend/test_tasks.py, tests/frontend/test_dashboard.test.tsx. Настрой workflow .github/workflows/ci.yml для запуска pytest и jest.` | ✅ pytest + Vitest UI тесты + CI workflow. |

---

## 📊 Краткое описание моделей
| Модель | Когда использовать |
|---|---|
| **Sonnet 4.6** | Точные правки кода, рефакторинг, работа с React/Next.js. |
| **Gemini 3.1 High** | NLP‑задачи, Intent Extraction, генерация схем. |
| **Opus 4.6** | Сложные математические расчёты, алгоритмическая логика, тесты. |
| **GPT 120** | Генерация конфигурационных файлов, boilerplate‑кода. |

---

## 🗂️ Структура файлов (после выполнения задач)
```
AETERNA/
├─ backend/
│  └─ app/
│     ├─ routers/
│     │   ├─ auth.py
│     │   ├─ tasks.py
│     │   ├─ analytics.py   # ← обновлен Decay
│     │   └─ ai.py          # ← новый роутер
│     └─ schemas/
│         ├─ task.py
│         └─ ai.py          # ← новые схемы
├─ frontend/
│  └─ src/
│     ├─ app/
│     │   ├─ page.tsx      # ← подключён API, анимации
│     │   └─ layout.tsx
│     └─ public/
│         └─ manifest.json # ← PWA‑манифест
└─ PROJECT_PLAN.md          # ← текущий файл
```

---

## 📅 Приоритеты и сроки (примерные)
| Sprint | Длительность | Задачи |
|---|---|---|
| **Sprint 1** | 1 неделя | 1, 2 |
| **Sprint 2** | 1 неделя | 3, 4 |
| **Sprint 3** | 1 неделя | 5, 6 |

---

*Все задачи описаны в формате, готовом к импорту в трекер (Jira, ClickUp и т.п.). При необходимости могу сгенерировать CSV‑файл с задачами.*
