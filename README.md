# TickTick Clone — полный аналог с Premium-функциями бесплатно

Веб-приложение, максимально близкое к [TickTick](https://ticktick.com), со всеми ключевыми и премиум-функциями, доступными без оплаты. Интерфейс на русском языке.

## Стек

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: NestJS + TypeScript
- **База данных**: PostgreSQL + Prisma
- **Кэш / realtime**: Redis + Socket.io
- **Файлы**: MinIO (S3-совместимое)
- **AI**: Python FastAPI
- **Инфраструктура**: Docker Compose + Nginx

## Быстрый старт

### 1. Клонирование и настройка

```bash
cp .env.example .env
# Отредактируйте .env — особенно NEXTAUTH_SECRET и JWT_SECRET
```

### 2. Запуск через Docker (рекомендуется)

```bash
docker compose up -d --build
```

Сервисы:
- Фронтенд: http://localhost:3000
- API + Swagger: http://localhost:3001/api/docs
- AI-сервис: http://localhost:8000
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)
- Nginx: http://localhost

### 3. Локальная разработка (без Docker для кода)

```bash
# Поднять только инфраструктуру
docker compose up -d postgres redis minio

# Установить зависимости
npm install

# Prisma
npm run db:generate
npm run db:push

# Запуск
npm run dev
```

## Структура проекта

```
ticktick-clone/
├── apps/
│   ├── web/          # Next.js фронтенд (русский UI)
│   ├── api/          # NestJS бэкенд
│   └── ai-service/   # FastAPI AI-микросервис
├── packages/
│   └── database/     # Prisma schema + клиент
├── docker/
│   └── nginx/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Реализовано на текущем этапе (MVP-скелет)

- [x] Полная архитектура монорепо
- [x] docker-compose.yml со всеми сервисами
- [x] Prisma-схема (Users, Projects, Tasks, Subtasks, Tags, Habits, Goals, Focus, SmartLists, Attachments, Reminders, Recurrence и т.д.)
- [x] Базовый Next.js UI на русском
- [x] NestJS skeleton + Swagger
- [x] FastAPI AI-сервис (разбиение задач + определение приоритета)
- [x] Nginx reverse-proxy
- [x] .env.example

## План дальнейшей реализации

### Этап 1 — MVP (задачи + проекты)
- CRUD задач и проектов
- Подзадачи, приоритеты, сроки
- Авторизация (email + OAuth)
- Базовые представления: Список + Канбан

### Этап 2 — Привычки, цели, календарь
- Habits + streaks + heatmaps
- Goals + прогресс
- Календарь (день/неделя/месяц)
- Pomodoro

### Этап 3 — Premium-фичи
- Матрица Эйзенхауэра
- Гант / Timeline
- Умные списки и фильтры
- Совместная работа + роли
- AI-рекомендации
- Оффлайн (PWA)
- Экспорт/импорт

### Этап 4 — Полировка
- Drag-and-drop везде
- Горячие клавиши
- Темы и цветовые схемы
- Уведомления
- Тесты + CI/CD

## Лицензия

MIT — используйте свободно.
