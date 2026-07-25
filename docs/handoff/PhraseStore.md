# ⏳ SESSION HANDOFF (as of 25.07.26)

## Что делать дальше (по приоритету)

1. **Добить Google OAuth на Vercel** — в ошибке Google явно видно, что приложение шлёт callback как `http://phrase-store-five.vercel.app/...`, а нужен **`https://`**. В Vercel Production Env выставить `AUTH_URL=https://phrase-store-five.vercel.app` (без слэша), Redeploy. В Google Console → Authorized redirect URIs добавить **точно** `https://phrase-store-five.vercel.app/api/auth/callback/google` (+ localhost для dev). Пока это не совпадёт — вход на проде не заработает.
2. **Проверить полный happy-path на проде после фикса URI**: `/` → Google → `/db` → данные из Neon; выход; повторный вход; `/my-phrases` / `/dashboard` под middleware.
3. **Прогнать `prisma migrate deploy` на Neon с Vercel build** — история `_prisma_migrations` на Neon уже вручную выровнена под репо; после следующего успешного деплоя убедиться, что build больше не падает на `P3009`.
4. **Продуктовый слой поверх auth** (осознанно не начат): создание/редактирование своих Phrase в UI, публичная лента, голосование с проверкой PUBLIC, нормальный UX кабинета вместо «сырого» просмотра всех таблиц.

---

## Git-состояние

| | |
|---|---|
| **Worktree** | `C:/Work/PhraseStore` (единственный) |
| **Ветка** | `main` (см. актуальный `git status` / `git log -1`) |
| **Открытые PR** | **нет** (репозиторий `alzh2572/PhraseStore`; история шла прямыми пушами в `main`) |

Production URL проекта на Vercel: **https://phrase-store-five.vercel.app**

---

## Что специально НЕ начато

- UI создания/редактирования фраз пользователем (только просмотр таблиц `/db` read-only из БД).
- Публичная витрина фраз / поиск / теги / категории в продуктовом UI.
- Голосование (Vote) в UI и enforcement «голос только за PUBLIC» на уровне API/триггера.
- Collection/Folder и PhraseVersion из `DATABASE.md` (были помечены как optional).
- Полноценный Auth.js **database session strategy** в middleware (осознанно ушли на JWT из‑за Edge).
- Синхронизация local ↔ Neon как регулярный процесс (есть разовые скрипты, не продукт).
- Переименование `middleware.ts` → `proxy.ts` (Next 16 предупреждает, но не трогали).

---

## Сделано 25.07.26

- **view-db вынесен из основного приложения** в отдельный локальный инструмент `tools/view-db`.
  - Запуск: `npm run view-db` → `http://127.0.0.1:3010` (bind только localhost).
  - Удалены маршруты `/view-db`, ссылки в nav/`/db`, matcher в middleware и `auth.config`.
  - На Vercel CRUD к БД больше не входит в бандл PhraseStore.

---

## Неочевидные решения (ПОЧЕМУ)

1. **JWT + Prisma Adapter, а не database sessions в middleware**  
   Database sessions + импорт `auth.ts` (Prisma) в Edge middleware давали `node:util/types` / native module not found. Разделили: `auth.config.ts` (edge) для middleware, `auth.ts` (Node + adapter) для route handlers/RSC. User всё равно создаётся в БД при первом Google-входе; `user.id` кладётся в JWT → `session.user.id`.

2. **Локальный Postgres для `migrate dev`, Neon для Vercel**  
   Прямой TCP Prisma CLI к Neon с этой Windows-машины часто `P1017` / advisory lock; pooler не подходит для migrate. Поэтому workflow: schema → `migrate dev` на localhost → commit SQL → на проде `migrate deploy` (из Vercel это доходит). Для разовых правок Neon с ПК использовали `@prisma/adapter-neon` или `pg`+pooler, не `migrate` по unpooled TCP.

3. **Сквош / ручной baseline `_prisma_migrations` на Neon**  
   В Neon копились чужие/старые имена миграций + failed `20260724160000_init` → Vercel build `P3009`. Репо держит две миграции (`…160000_init`, `…170000_auth_google`). Историю на Neon переписали под них вручную (скрипт через pooler), иначе `migrate deploy` в `npm run build` вечно валил деплой.

4. **Стартовый UX: `/` = бренд + Google, БД только после входа**  
   Просмотр таблиц на `/db`, middleware закрывает путь. `/login` редиректит на `/`. Вход на проде ведёт на `/api/auth/google` → `signIn("google")`, чтобы OAuth URL собирался на Node.

5. **view-db — отдельная программа, не route в Next**  
   Полный SQL CRUD рядом с публичным OAuth-приложением рискован даже «за логином» / `NODE_ENV`. Вынесен в `tools/view-db` (Node HTTP на `127.0.0.1`), основной app только read-only `/db`.

6. **`AUTH_URL` обязан совпадать со схемой и хостом браузера**  
   Реальный fail на проде: приложение слало `redirect_uri=http://phrase-store-five.vercel.app/...` при живом `https://` сайте → Google `redirect_uri_mismatch`. Недостаточно «добавить URI» — нужна именно **https** в `AUTH_URL` на Vercel.

---

## Ловушки / грабли для следующей сессии

1. **Не чинить OAuth только в коде**, пока в Vercel `AUTH_URL` не `https://phrase-store-five.vercel.app` — текущий mismatch уже доказан query `redirect_uri=http://...` в ответе Google.
2. **Порт localhost**: если `next dev` уйдёт на 3001, а `AUTH_URL=http://localhost:3000` — снова 401 / mismatch. Смотреть фактический Local URL в терминале.
3. **Не запускать `prisma migrate reset` / полный DROP на Neon** без явного согласия; локальный reset тоже блокируется Prisma AI-safety. Для Neon предпочитать идемпотентный SQL + правка `_prisma_migrations` через pooler, если TCP unpooled сдох.
4. **Не импортировать `@/auth` или Prisma в `middleware.ts`** — вернётся Edge-падение. Только `auth.config.ts`.
5. **Секреты Google/Neon уже светились в `.env` в чате** — при публикации handoff/репо не копировать значения; ротация client secret желательна, если репозиторий/логи могли утечь.
6. **Vercel build = `prisma generate && prisma migrate deploy && next build`**. Любая failed-строка в `_prisma_migrations` на Neon снова убьёт весь деплой (`P3009`), даже если схема уже «нормальная».
7. **В Google Console URI должен совпасть символ-в-символ** (схема, хост, путь `/api/auth/callback/google`, без trailing slash). Origins отдельно: `https://phrase-store-five.vercel.app`.
8. **Клиент OAuth = Web application**; в ошибках фигурировало имя приложения «Potato App» в Console — это branding клиента, не баг PhraseStore.
9. **После смены Env на Vercel нужен Redeploy** — иначе рантайм продолжит старый `AUTH_URL=http://...`.
10. **Не путать «таблицы не видны»**: главная `/` больше не показывает БД; без сессии пользователь увидит только login. Данные — `/db` после Google. CRUD — только `npm run view-db` локально.
