<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=32&pause=1000&color=3B82F6&center=true&vCenter=true&width=620&height=60&lines=TaskFlow;Task+Manager;Focus+%C2%B7+Habits+%C2%B7+Goals" alt="TaskFlow animated title" />
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:3B82F6,100:8B5CF6&height=120&section=header" />
</p>

---

<p align="center">
  <img src="https://wsrv.nl/?url=avatars.githubusercontent.com/u/146373364%3Fv%3D4&w=200&h=200&fit=cover&mask=circle" width="120" alt="Axsion avatar" />
</p>

<h2 align="center">Maxsim (Axsion)</h2>

<p align="center">
  Full-stack Developer · TypeScript · Python · Product UI
</p>

<p align="center">
  <a href="https://github.com/AxsionTM">
    <img src="https://img.shields.io/badge/GitHub-AxsionTM-black?style=for-the-badge&logo=github" alt="GitHub" />
  </a>
</p>

---

## О проекте

**TaskFlow** — полнофункциональный веб-менеджер задач в духе TickTick: задачи и проекты, канбан, календарь, матрица Эйзенхауэра, привычки, цели, фокус (Pomodoro), статистика «Пульс», темы оформления и AI-помощник.

Интерфейс на русском. Проект сделан как портфолио-кейс: monorepo, отдельный API, отдельный AI-сервис, Docker и продуманный UX (онбординг, эффекты, профиль).

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-API-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/FastAPI-AI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

---

## Скриншоты

> Добавьте свои скрины в `docs/screenshots/` и раскомментируйте блоки ниже.

<p align="center">
  <!-- <img src="docs/screenshots/today.png" width="49%" alt="Сегодня" />
  <img src="docs/screenshots/kanban.png" width="49%" alt="Канбан" /> -->
</p>

<p align="center">
  <!-- <img src="docs/screenshots/profile.png" width="49%" alt="Профиль" />
  <img src="docs/screenshots/themes.png" width="49%" alt="Темы" /> -->
</p>

---

## Функционал

### Задачи и проекты
- Создание задач в модальном окне (название, описание, приоритет, проект, теги, срок)
- Подзадачи, чек-листы, флаги приоритета
- Умные списки: Сегодня, Завтра, Неделя, Просроченные, Повестка дня, Входящие
- Проекты с созданием и удалением
- Корзина (мягкое удаление)

### Представления
- Список
- Канбан (колонки + drag-and-drop, выполненные остаются в «Готово»)
- Календарь (месяц / неделя / день)
- Матрица Эйзенхауэра

### Привычки, цели, фокус
- Привычки с heatmap и сериями
- Цели с прогрессом (+1 / +5 / +10 / +50 / +100 / своё число)
- Pomodoro-таймер в фоне + бейдж в сайдбаре
- Раздел **Пульс** — диаграмма и индекс продуктивности

### UX и оформление
- 6 тем: светлая, тёмная, океан, лес, энергия, неон
- Превью темы при наведении
- Эффекты: частицы, glow при hover, «змея» по обводке (вкл/выкл)
- Онбординг для нового пользователя
- Профиль со статистикой
- Глобальный поиск, экспорт JSON/CSV, PWA

### AI
- Разбиение задачи на шаги и подсказка приоритета
- Отдельный Python-сервис + локальный fallback в API

---

## Стек

| Слой | Технологии |
|------|------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, dnd-kit, next-themes |
| **Backend** | Node.js, Express, Prisma, PostgreSQL, Redis, JWT |
| **AI** | FastAPI (Python), эвристики fallback |
| **Infra** | Docker Compose, Nginx, MinIO (вложения) |

---

## Архитектура

```text
ticktick-clone/
├── apps/
│   ├── web/                 # Next.js клиент (UI)
│   ├── api/                 # Express + Prisma API
│   └── ai/                  # FastAPI AI-сервис
├── packages/                # общие пакеты (при наличии)
├── docs/                    # документация и скриншоты
├── docker-compose.yml
├── nginx.conf
└── README.md
```

---

## Быстрый старт

### Требования

- Node.js 20+
- PostgreSQL 15+ (или Docker)
- Python 3.11+ (для AI, опционально)
- Docker / Docker Compose (рекомендуется)

### Установка

```bash
git clone https://github.com/AxsionTM/taskflow.git
cd taskflow

npm run install:all
# или вручную:
# cd apps/api && npm install
# cd ../web && npm install
```

### Переменные окружения

В `apps/api/.env` (пример):

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/taskflow
JWT_SECRET=change-me
PORT=3001
AI_SERVICE_URL=http://127.0.0.1:8000
```

В `apps/web` при необходимости:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Схема базы данных

Для локальной разработки используйте безопасную синхронизацию схемы:

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

`db push` здесь выбран специально: проект поставляется без каталога миграций, а `prisma migrate dev` при обнаружении drift может предложить сбросить dev-базу. Скрипт `scripts/setup.sh` больше не использует `migrate dev` и не проглатывает ошибки.

### Запуск в разработке

Три терминала:

```bash
# API
cd apps/api && npm run dev

# Web
cd apps/web && npm run dev

# AI (опционально)
cd apps/ai && pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Или через Docker:

```bash
docker compose up --build
```

Откройте [http://localhost:3000](http://localhost:3000).

---

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev:api` | API на порту 3001 |
| `npm run dev:web` | Frontend на порту 3000 |
| `npm run dev:ai` | AI-сервис на порту 8000 |
| `npm run install:all` | Установка зависимостей api + web |

---

## Планы

- [ ] Деплой API + web + БД на облачный хостинг
- [ ] Полноценный OAuth (Google / GitHub) в проде
- [ ] Push-уведомления и напоминания
- [ ] Совместные проекты и роли
- [ ] Мобильная адаптация / PWA install prompt

---

## Лицензия

Учебный / портфолио-проект. Код открыт для ознакомления и переиспользования.

<p align="center">
  Made by <a href="https://github.com/AxsionTM">Axsion</a>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:8B5CF6,100:3B82F6&height=100&section=footer" />
</p>
