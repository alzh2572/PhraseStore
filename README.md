# PhraseStore

Минимальный Next.js (App Router) + Prisma 7 + PostgreSQL.
Локально — Postgres, в продакшене — Neon (Vercel).

## Сущность

`Note`: `id` (uuid), `title` (string), `createdAt` (DateTime)

## Workflow Prisma (обязательный порядок)

Когда нужно поменять схему БД:

1. Меняем `prisma/schema.prisma`
2. Запускаем `prisma migrate dev` (локальная БД)
3. Проверяем локально (`npm run dev`)
4. Коммитим файлы миграции в `prisma/migrations/`
5. На рабочей БД (Vercel build / вручную) — `prisma migrate deploy`
6. Проверяем работу на Neon / production

```powershell
# 1–2. Изменили schema.prisma, затем:
npx prisma migrate dev --name describe_change

# 3. Локальная проверка
npm run db:seed   # при необходимости
npm run dev

# 4. git add prisma/migrations ; git commit ...

# 5. На Vercel выполняется автоматически в npm run build
#    или вручную с prod-переменными:
npx prisma migrate deploy
```

## Быстрый старт (PowerShell)

```powershell
npm install

# Локальный Postgres (если ещё нет)
# Вариант A — уже установленный Postgres на :5432
# Вариант B — Docker:
docker compose up -d

Copy-Item .env.example .env
# В .env уже указан localhost. Neon — только в Vercel.

npm run db:setup
npm run dev
```

http://localhost:3000 — данные из **локального** Postgres.

### Auth (Google OAuth)

```powershell
# В .env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET, AUTH_URL
npm run dev
# http://localhost:3000/login
```

Защищены middleware: `/dashboard`, `/my-phrases`. Сессии — database (таблица `Session`).

### view-db (тест)

```powershell
npm run dev
# откройте http://localhost:3000/view-db
```

Выбор локальной или рабочей БД (`DATABASE_URL_LOCAL` / `DATABASE_URL_REMOTE`), список таблиц, пагинация и CRUD. Только в `development`.

## Переменные окружения

| Переменная | Local | Vercel (Neon) |
|---|---|---|
| `DATABASE_URL` | `localhost:5432/phrasestore` | pooled URL (`-pooler`) |
| `DATABASE_URL_UNPOOLED` | тот же local URL | direct URL (без `-pooler`) |

Приложение само выбирает адаптер: `pg` для localhost, `@prisma/adapter-neon` для Neon.

## Деплой на Vercel

В **Environment Variables** задайте Neon URLs (не local).

`build`: `prisma generate` → `prisma migrate deploy` → `next build`

## Команды

```powershell
npm run db:migrate   # prisma migrate dev  (локально)
npm run db:deploy    # prisma migrate deploy (prod / Neon)
npm run db:seed
npm run db:studio
```
