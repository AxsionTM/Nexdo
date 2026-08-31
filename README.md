# TaskFlow

Полнофункциональный менеджер задач с поддержкой привычек, целей, фокус-режима и AI-ассистента.

## Возможности

- Задачи с подзадачами, приоритетами, сроками, тегами и чек-листами
- Проекты и разделы
- Умные списки: Сегодня, Завтра, Просроченные
- Привычки с трекингом
- Цели и прогресс
- Pomodoro / Фокус-режим
- Тёмная и светлая тема
- Русскоязычный интерфейс

## Стек

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js (Express), Prisma, PostgreSQL, Redis
- **AI**: FastAPI (Python)
- **Инфраструктура**: Docker Compose, Nginx, MinIO

## Быстрый старт

### Требования

- Docker и Docker Compose
- Node.js 20+ (для локальной разработки)
- Python 3.12+ (для AI-сервиса)

### Запуск через Docker

```bash
docker compose up -d postgres redis minio
```

Затем в отдельных терминалах:

```bash
# API
cd apps/api
cp .env.example .env
npm install
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

Откройте http://localhost:3000

### Переменные окружения

См. `apps/api/.env.example`

## Структура проекта

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

## API

Базовый URL: `http://localhost:3001`

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /auth/register | Регистрация |
| POST | /auth/login | Вход |
| GET | /auth/me | Текущий пользователь |
| GET | /tasks | Список задач |
| POST | /tasks | Создать задачу |
| PATCH | /tasks/:id | Обновить задачу |
| DELETE | /tasks/:id | Удалить задачу |
| GET | /projects | Список проектов |
| GET | /habits | Список привычек |
| GET | /goals | Список целей |

## Лицензия

MIT
