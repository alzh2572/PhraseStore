# PhraseStore

Минимальный Next.js (App Router) + Prisma 7 + Neon (PostgreSQL), готовый к деплою на Vercel.

## Стек

- Next.js + TypeScript (App Router)
- Prisma ORM 7 + `@prisma/adapter-neon`
- NeonDB (PostgreSQL)

## Сущность

`Note`: `id` (uuid), `title` (string), `createdAt` (DateTime)

## Быстрый старт (PowerShell)

```powershell
# 1. Зависимости
npm install

# 2. Env
Copy-Item .env.example .env
# В Neon Console скопируйте:
# - Pooled URL  -> DATABASE_URL          (есть -pooler в хосте)
# - Direct URL  -> DATABASE_URL_UNPOOLED (без -pooler)

# 3. Миграция
# Вариант A — стандартный Prisma CLI (нужен рабочий Direct URL):
npx prisma migrate dev --name init

# Вариант B — через Neon serverless adapter (если migrate по TCP падает):
npm run db:apply

# 4. Seed
npm run db:seed

# 5. Локальный сервер
npm run dev
```

Откройте http://localhost:3000 — главная читает заметки из Neon.

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | Pooled URL (`-pooler`) — runtime приложения |
| `DATABASE_URL_UNPOOLED` | Direct URL — Prisma Migrate / CLI |

На Vercel: **Project Settings → Environment Variables** — те же ключи.

## Деплой на Vercel

```powershell
npm i -g vercel
vercel
```

Или подключите GitHub-репозиторий в Vercel Dashboard.

Скрипт `build`: `prisma generate` → `prisma migrate deploy` → `next build`

## Полезные команды

```powershell
npm run db:migrate   # prisma migrate dev
npm run db:deploy    # prisma migrate deploy
npm run db:apply     # применить SQL через Neon adapter
npm run db:seed      # заполнить Note
npm run db:studio    # Prisma Studio
npm run build        # production build
```
