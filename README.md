# TaskFlow

Полнофункциональный менеджер задач с поддержкой привычек, целей, фокус-режима и AI-ассистента.

## Возможности

- Задачи: подзадачи, приоритеты, сроки, теги, чек-листы, описание
- Представления: список, канбан, календарь (день/неделя/месяц), матрица Эйзенхауэра
- Проекты и умные списки (Сегодня, Завтра, Неделя, Просроченные)
- Привычки с трекингом, streak и heatmap
- Цели с прогресс-барами
- Pomodoro-таймер и статистика фокуса
- AI: разбиение задачи на подзадачи, определение приоритета
- Глобальный поиск (⌘K)
- Экспорт в JSON и CSV
- Тёмная / светлая тема
- PWA (оффлайн-кэш)
- Русскоязычный интерфейс

## Стек

- Frontend: Next.js 14, TypeScript, Tailwind CSS, Zustand
- Backend: Node.js (Express), Prisma, PostgreSQL, Redis
- AI: FastAPI (Python)
- Инфраструктура: Docker Compose, Nginx, MinIO

## Быстрый старт

### Требования

- Docker и Docker Compose
- Node.js 20+
- Python 3.12+ (для AI, опционально)

### Запуск

```bash
# Инфраструктура
docker compose up -d postgres redis minio

# API
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev

# Web
cd apps/web
npm install
npm run dev

# AI (опционально)
cd apps/ai
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Сайт: http://localhost:3000

## Структура

```
ticktick-clone/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Express backend
│   └── ai/           # FastAPI AI service
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## API (основные эндпоинты)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /auth/register | Регистрация |
| POST | /auth/login | Вход |
| GET/POST | /tasks | Задачи |
| GET/POST | /projects | Проекты |
| GET/POST | /habits | Привычки |
| GET/POST | /goals | Цели |
| GET/POST | /focus/sessions | Фокус-сессии |
| POST | /ai/breakdown | AI: подзадачи |
| POST | /ai/priority | AI: приоритет |
| GET | /export/json | Экспорт JSON |
| GET | /export/csv | Экспорт CSV |

## Лицензия

MIT
