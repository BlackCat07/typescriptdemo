# 01 — Application Specification

## Stack

| Item | Choice |
|---|---|
| Runtime | Node 22, ESM (`"type": "module"`) |
| Package manager | pnpm |
| Language | TypeScript 5, strict mode |
| HTTP framework | Fastify 5 |
| ORM | Drizzle ORM + `postgres` driver |
| Database | PostgreSQL (pool max 10) |
| Validation | Zod 3 |
| Path alias | `@app/*` → `src/*` |
| Test runner | Vitest 2 |

---

## Folder layout

```
typescript-demo/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── drizzle.config.ts
├── docker-compose.yml            ← plausibility only, never executed
├── src/
│   ├── index.ts                  ← Fastify app factory + plugin registration
│   ├── platform/
│   │   ├── config.ts             ← typed env vars (PORT, DATABASE_URL, JWT_SECRET)
│   │   └── errors.ts             ← HttpError factory helpers (notFound, forbidden, …)
│   ├── db/
│   │   ├── client.ts             ← Drizzle pool instance
│   │   ├── schema.ts             ← all six baseline tables in one file
│   │   └── migrations/
│   │       └── 0001_init.sql
│   ├── adapters/
│   │   └── mailer.ts             ← stub: logs to console, never sends real email
│   ├── contracts/
│   │   └── tasks.ts              ← Zod schemas shared across tasks module
│   └── modules/
│       ├── health/
│       │   └── routes.ts
│       ├── auth/
│       │   ├── routes.ts
│       │   └── service.ts
│       ├── workspaces/
│       │   ├── routes.ts
│       │   ├── service.ts
│       │   └── repo.ts
│       ├── projects/
│       │   ├── routes.ts
│       │   ├── service.ts
│       │   └── repo.ts
│       ├── tasks/
│       │   ├── routes.ts
│       │   ├── service.ts
│       │   └── repo.ts
│       ├── comments/
│       │   ├── routes.ts
│       │   ├── service.ts
│       │   └── repo.ts
│       └── notifications/
│           ├── routes.ts
│           ├── service.ts
│           └── repo.ts
└── test/
    ├── tasks.test.ts
    ├── projects.test.ts
    ├── comments.test.ts
    └── auth.test.ts
```

**Total: 31 files** (5 root + 1 index + 2 platform + 3 db + 1 mailer + 1 contracts +
1 health + 2 auth + 3 workspaces + 3 projects + 3 tasks + 3 comments + 3 notifications +
4 tests). Target is ≈ 1 400 lines across all `.ts` files — keep every file short.

---

## Database schema (`src/db/schema.ts`)

All tables use `uuid` primary keys (`gen_random_uuid()`). All timestamps are `timestamptz`
with `DEFAULT now()`. Define all six tables and all indexes in this single file.

### workspaces

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | |
| slug | text NOT NULL | unique index `workspaces_slug_idx` |
| created_at | timestamptz | DEFAULT now() |

### users

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid NOT NULL | FK → workspaces.id; index `users_workspace_id_idx` |
| email | text NOT NULL | unique index `users_email_idx` |
| password_hash | text NOT NULL | |
| name | text NOT NULL | |
| created_at | timestamptz | DEFAULT now() |

### memberships

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid NOT NULL | FK → workspaces.id |
| user_id | uuid NOT NULL | FK → users.id |
| role | text NOT NULL | `'member' \| 'admin' \| 'owner'`; DEFAULT `'member'` |
| created_at | timestamptz | DEFAULT now() |

Unique index `memberships_workspace_user_idx` on `(workspace_id, user_id)`.

### projects

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid NOT NULL | FK → workspaces.id; index `projects_workspace_id_idx` |
| name | text NOT NULL | |
| description | text | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

### tasks

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| project_id | uuid NOT NULL | FK → projects.id; index `tasks_project_id_idx` |
| workspace_id | uuid NOT NULL | FK → workspaces.id; index `tasks_workspace_id_idx` |
| title | text NOT NULL | |
| description | text | |
| status | text NOT NULL | `'todo' \| 'in_progress' \| 'done'`; DEFAULT `'todo'` |
| assignee_id | uuid | FK → users.id (nullable) |
| due_date | timestamptz | index `tasks_due_date_idx` |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

Composite index `tasks_project_status_idx` on `(project_id, status)`.

### comments

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| task_id | uuid NOT NULL | FK → tasks.id; index `comments_task_id_idx` |
| workspace_id | uuid NOT NULL | FK → workspaces.id; index `comments_workspace_id_idx` |
| author_id | uuid NOT NULL | FK → users.id |
| body | text NOT NULL | |
| created_at | timestamptz | DEFAULT now() |

---

## Endpoints

All routes (except `GET /health`) are authenticated via a JWT preHandler. The JWT is issued
at login and carries `{ userId, workspaceId }`.

### Health

| Method | Path | Response |
|---|---|---|
| GET | /health | 200 `{ status: 'ok' }` |

### Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | /auth/register | `{ email, password, name, workspaceSlug }` | 201 `{ token }` |
| POST | /auth/login | `{ email, password }` | 200 `{ token }` |

### Workspaces

| Method | Path | Response |
|---|---|---|
| GET | /workspaces/:id | 200 workspace |
| PATCH | /workspaces/:id | 200 workspace |

### Projects

| Method | Path | Response |
|---|---|---|
| POST | /workspaces/:workspaceId/projects | 201 project |
| GET | /workspaces/:workspaceId/projects | 200 project[] |
| GET | /workspaces/:workspaceId/projects/:id | 200 project |
| PATCH | /workspaces/:workspaceId/projects/:id | 200 project |
| DELETE | /workspaces/:workspaceId/projects/:id | 204 |

### Tasks

| Method | Path | Response |
|---|---|---|
| POST | /projects/:projectId/tasks | 201 task |
| GET | /projects/:projectId/tasks | 200 task[] |
| GET | /projects/:projectId/tasks/:id | 200 task |
| PATCH | /projects/:projectId/tasks/:id | 200 task |
| DELETE | /projects/:projectId/tasks/:id | 204 |

### Comments

| Method | Path | Response |
|---|---|---|
| POST | /tasks/:taskId/comments | 201 comment |
| GET | /tasks/:taskId/comments | 200 comment[] |

### Notifications

| Method | Path | Response |
|---|---|---|
| GET | /workspaces/:workspaceId/notifications | 200 `{ items: Notification[], total: number }` |
| POST | /workspaces/:workspaceId/notifications/mark-read | 200 `{ updated: number }` |

A `Notification` in baseline `main` is derived from recent tasks and comments (no separate
`notifications` table exists yet — it is computed on read). The `mark-read` endpoint is a
stub that returns `{ updated: 0 }`.

---

## Config file contents

### `package.json`

```json
{
  "name": "typescript-demo",
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "@fastify/jwt": "^9.0.0",
    "drizzle-orm": "^0.31.0",
    "fastify": "^5.0.0",
    "postgres": "^3.4.4",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "drizzle-kit": "^0.22.0",
    "tsx": "^4.15.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "paths": { "@app/*": ["src/*"] },
    "baseUrl": "."
  },
  "include": ["src", "test"]
}
```

### `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: { '@app': resolve(import.meta.dirname, 'src') },
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
```

### `drizzle.config.ts`

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
})
```

### `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: typescript_demo
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
```

---

## Baseline quality bar

`main` must be deliberately clean. The prompts instruct the model to flag only what *this diff*
introduced, so any noise in the baseline will corrupt the signal.

Before cutting any PR branch, verify every item in this checklist. `tsc --noEmit` and
`vitest run` must both exit 0.

---

### Rule 1 — Tenant-scoped queries

Every query that touches workspace-owned data must include `workspaceId` in the WHERE clause.
No lookup by bare `id` without workspace scope.

**Wrong:**
```ts
// Any authenticated user can read any task — cross-tenant read
const task = await db
  .select()
  .from(tasks)
  .where(eq(tasks.id, taskId))
  .then(r => r[0])
```

**Right:**
```ts
const task = await db
  .select()
  .from(tasks)
  .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
  .then(r => r[0])
```

---

### Rule 2 — Parameterised SQL

Use Drizzle's query builder or tagged `sql` template literals. Never pass user input to
`sql.raw()`.

**Wrong:**
```ts
// SQL injection via searchTerm
const rows = await db.execute(sql.raw(`SELECT * FROM tasks WHERE title LIKE '${searchTerm}%'`))
```

**Right:**
```ts
const rows = await db
  .select()
  .from(tasks)
  .where(like(tasks.title, `${searchTerm}%`))
```

---

### Rule 3 — All promises awaited

No `forEach(async …)`, no fire-and-forget inserts, every async call in a handler awaited.

**Wrong:**
```ts
// forEach discards the returned promises — response returns before inserts finish
items.forEach(async (item) => {
  await db.insert(tasks).values(item)
})
```

**Right:**
```ts
await Promise.all(items.map((item) => db.insert(tasks).values(item)))
// or a single batch insert:
await db.insert(tasks).values(items)
```

---

### Rule 4 — Index behind every filtered column

Every column that appears in a WHERE clause (and is not a primary key) must have an index in
`schema.ts`. See the schema table above — all required indexes are listed explicitly.

**Wrong:**
```ts
// due_date used in WHERE but no index → sequential scan on large tables
.where(lt(tasks.dueDate, new Date()))
// and in schema.ts, no index on dueDate
```

**Right:**
```ts
// schema.ts:
export const tasksDueDateIdx = index('tasks_due_date_idx').on(tasks.dueDate)
```

---

### Rule 5 — Auth failing closed

If the JWT preHandler throws or cannot verify, the request must be **rejected with 401**. No
code path may allow a request to proceed unauthenticated.

**Wrong:**
```ts
fastify.addHook('preHandler', async (req, reply) => {
  try {
    req.user = await fastify.jwt.verify(req.headers.authorization ?? '')
  } catch (err) {
    fastify.log.error(err)
    return  // ← request continues unauthenticated
  }
})
```

**Right:**
```ts
fastify.addHook('preHandler', async (req, reply) => {
  try {
    req.user = await fastify.jwt.verify(req.headers.authorization ?? '')
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
})
```

---

### Rule 6 — No unbounded list endpoints

Every list endpoint must enforce a maximum page size. Default 50, hard cap 100.

**Wrong:**
```ts
// Returns every row in the table
const rows = await db.select().from(tasks).where(eq(tasks.projectId, projectId))
```

**Right:**
```ts
const limit = Math.min(query.limit ?? 50, 100)
const offset = (query.page ?? 0) * limit
const rows = await db
  .select()
  .from(tasks)
  .where(eq(tasks.projectId, projectId))
  .limit(limit)
  .offset(offset)
```

---

### Rule 7 — Errors and missing rows handled explicitly

Do not rely on falsy checks for empty Drizzle result arrays. Drizzle always returns an array
(never null). Check `rows.length === 0` to detect not-found.

**Wrong:**
```ts
const rows = await db.select().from(tasks).where(...)
if (!rows) throw errors.notFound('Task')  // never fires — rows is always []
return rows
```

**Right:**
```ts
const rows = await db.select().from(tasks).where(...)
if (rows.length === 0) throw errors.notFound('Task')
return rows[0]
```

---

### Gate

The building agent must confirm both commands pass before cutting any PR branch:

```
pnpm typecheck   # tsc --noEmit — zero errors
pnpm test        # vitest run   — zero failures
```
