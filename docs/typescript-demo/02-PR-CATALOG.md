# 02 — Pull Request Catalog

Each PR is an independent branch off `main`. All six core PRs (plus two optional) must be open
simultaneously with `state: 'open'` — DevDigest lists with `state: 'all'`.

Groundability rule (from `00-OVERVIEW.md`): every planted defect must sit on an **added or
modified line inside a small hunk** in a `.ts` file. Keep the flawed function to ≤ 30 added
lines so the model's line estimate lands inside the covered `[start_line, end_line]` range.

---

## PR 1 — `chore/task-pagination` (clean control)

**Branch:** `chore/task-pagination`
**Title:** "Add pagination and sorting to GET /projects/:id/tasks"
**Body:**
> Tasks list returns all rows on large projects, causing timeouts. This PR adds offset-based
> pagination (`page`, `limit`) and a `sortBy` / `sortDir` query parameter. Limit is capped at
> 100 in the Zod schema. The sort column is `created_at` (already indexed via the composite
> index). Three new test cases cover page 0, page 1, and the sort direction.

**Approximate diff:** ~80 added lines, 4 files.

**Files touched:**

| File | Change |
|---|---|
| `src/contracts/tasks.ts` | Add `ListTasksQuerySchema` with `limit` (max 100), `page` (default 0), `sortBy`, `sortDir` |
| `src/modules/tasks/repo.ts` | Add `listPaginated(projectId, workspaceId, query)` using `.limit()` / `.offset()` / `.orderBy()` |
| `src/modules/tasks/routes.ts` | Replace existing list handler with `listPaginated`; validate query with schema |
| `test/tasks.test.ts` | Add three pagination tests (page 0, page 1, sort direction) |

**Planted defects:** none.

**Expected outcome:** `approve`, score 100, 0 findings.

**Purpose:** measures false-positive rate. Any CRITICAL finding here means the reviewer is too
aggressive.

---

## PR 2 — `fix/overdue-filter` (subtle correctness, no security)

**Branch:** `fix/overdue-filter`
**Title:** "Filter overdue tasks with due_date query parameter"
**Body:**
> Adds an `overdue=true` query flag to GET /projects/:id/tasks. When set, only tasks whose
> `due_date` is in the past are returned. Also adds a `dueBefore` date-string parameter for
> manual cutoff. Fixes the offset calculation to be consistent with the new pagination work.

**Approximate diff:** ~60 added lines, 3 files.

**Files touched:**

| File | Change |
|---|---|
| `src/contracts/tasks.ts` | Add `overdue: z.boolean().optional()` and `dueBefore: z.string().optional()` to query schema |
| `src/modules/tasks/repo.ts` | Add overdue filter branch; adjust offset; adjust limit fallback |
| `test/tasks.test.ts` | Add overdue filter test; mark one existing pagination test with `it.skip` |

---

### Planted defects (PR 2)

#### D2-1 — Off-by-one page offset [CRITICAL / bug]

**File:** `src/modules/tasks/repo.ts`
**Intended severity:** CRITICAL
**Category:** bug
**Kind:** logic_error

**What to write:** pages are labelled starting at 1 in the Zod schema (`z.number().int().min(1).default(1)`), but the offset is computed as `query.page * query.limit` instead of `(query.page - 1) * query.limit`. Page 1 skips the first `limit` rows; page 2 skips `2 × limit`; page N returns page N+1's data.

```ts
// planted (wrong):
const offset = query.page * query.limit   // page 1 → skips limit rows

// correct would be:
const offset = (query.page - 1) * query.limit
```

**Groundability:** the offset line is an added line in its own hunk. The function is ≤ 20 lines.

---

#### D2-2 — Empty-array truthiness trap [WARNING / bug]

**File:** `src/modules/tasks/repo.ts`
**Intended severity:** WARNING
**Category:** bug
**Kind:** logic_error

**What to write:** after the query, check with `if (!rows)` rather than `if (rows.length === 0)`.
Drizzle always returns an array, never null, so the not-found check never fires and the caller
receives an empty list instead of a 404.

```ts
// planted (wrong):
const rows = await db.select().from(tasks).where(/* ... */)
if (!rows) throw errors.notFound('Task')   // dead code — rows is always []
return rows
```

**Groundability:** the guard is an added line in the same hunk as the query.

---

#### D2-3 — Date string compared against timestamptz [WARNING / bug]

**File:** `src/modules/tasks/repo.ts`
**Intended severity:** WARNING
**Category:** bug
**Kind:** type_mismatch

**What to write:** the `dueBefore` parameter arrives as a `YYYY-MM-DD` string and is passed
directly to the Drizzle `lt()` filter without conversion to a `Date` object or `timestamptz`
cast. Postgres will implicitly cast, but the comparison truncates time, giving wrong results
for tasks due later the same day in non-UTC timezones.

```ts
// planted (wrong):
.where(lt(tasks.dueDate, query.dueBefore))   // string vs timestamptz

// correct would be:
.where(lt(tasks.dueDate, new Date(query.dueBefore)))
```

**Groundability:** the `lt()` call is on an added line in its own small hunk.

---

#### D2-4 — `it.skip` on existing pagination test [SUGGESTION / test]

**File:** `test/tasks.test.ts`
**Intended severity:** SUGGESTION
**Category:** test
**Kind:** skipped_test

**What to write:** the existing `'page 0 returns first page'` test is changed from `it(` to
`it.skip(` without explanation. The skip is introduced by this PR (i.e. it is on a modified
line, not context).

**Groundability:** the `it.skip` line is a modified line (changed from `it`), inside a
function diff hunk.

---

> **Note:** A fifth issue — `const limit = query.limit || 50` collapsing `limit: 0` to 50
> — is planted in `repo.ts` but is below the expected detection threshold and is not listed
> in the answer key's expected findings. It serves as a canary: if the model surfaces it as
> WARNING or higher it is over-reading.

---

## PR 3 — `feat/bulk-import` (async and error handling)

**Branch:** `feat/bulk-import`
**Title:** "Add bulk task import endpoint"
**Body:**
> POST /projects/:projectId/tasks/bulk accepts an array of task objects (title, description,
> status, dueDate). Returns 201 with `{ created: number }`. Each import is written to the
> audit_log for compliance. Adds the audit_log table.

**Approximate diff:** ~120 added lines, 4 files.

**Files touched:**

| File | Change |
|---|---|
| `src/db/schema.ts` | Add `audit_log` table: `id`, `workspace_id`, `action`, `entity_id`, `actor_id`, `created_at` |
| `src/contracts/tasks.ts` | Add `BulkImportBodySchema`: `items: z.array(TaskCreateSchema).min(1)` |
| `src/modules/tasks/repo.ts` | Add `bulkInsert(items, auditCtx)` — sequential inserts + audit write |
| `src/modules/tasks/routes.ts` | Add `POST /projects/:projectId/tasks/bulk` handler |

---

### Planted defects (PR 3)

#### D3-1 — `forEach(async …)` fire-and-forget [CRITICAL / bug]

**File:** `src/modules/tasks/routes.ts`
**Intended severity:** CRITICAL
**Category:** bug
**Kind:** async_misuse

**What to write:** the bulk handler iterates over `body.items` with `forEach`, passing an
`async` callback. The promises returned by the callbacks are discarded, so the handler sends
201 before any inserts have completed.

```ts
// planted (wrong):
body.items.forEach(async (item) => {
  await repo.insert({ ...item, projectId, workspaceId })
})
reply.status(201).send({ created: body.items.length })
```

**Groundability:** the `forEach` call and the premature `reply.send` are added lines in a
≤ 15-line handler hunk.

---

#### D3-2 — Missing `await` on audit write inside transaction [WARNING / bug]

**File:** `src/modules/tasks/repo.ts`
**Intended severity:** WARNING
**Category:** bug
**Kind:** missing_await

**What to write:** inside a `db.transaction()` callback, the audit log write is called without
`await`. The transaction may commit before the audit insert runs, leaving audit records missing
on partial failures.

```ts
// planted (wrong):
await db.transaction(async (tx) => {
  await tx.insert(tasks).values(item)
  tx.insert(auditLog).values(auditRecord)  // ← missing await
})
```

**Groundability:** the non-awaited insert is an added line in a ≤ 20-line transaction hunk.

---

#### D3-3 — Sequential per-row inserts instead of batch [WARNING / perf]

**File:** `src/modules/tasks/repo.ts`
**Intended severity:** WARNING
**Category:** perf
**Kind:** n_plus_1_writes

**What to write:** `bulkInsert` iterates over `items` and issues a separate
`await db.insert(tasks).values(row)` for each row in a loop, instead of a single
`await db.insert(tasks).values(items)`.

```ts
// planted (wrong):
for (const item of items) {
  await db.insert(tasks).values({ ...item, projectId, workspaceId })
}

// correct would be:
await db.insert(tasks).values(items.map(item => ({ ...item, projectId, workspaceId })))
```

**Groundability:** the for-loop and its `await` are added lines in the `bulkInsert` hunk.

---

#### D3-4 — Empty `catch {}` swallows partial failures [WARNING / bug]

**File:** `src/modules/tasks/routes.ts`
**Intended severity:** WARNING
**Category:** bug
**Kind:** swallowed_exception

**What to write:** a try/catch around the iteration has an empty catch body, so if any insert
fails the handler still returns 201 and reports the full `items.length` as created.

```ts
// planted (wrong):
try {
  body.items.forEach(async (item) => { /* … */ })
} catch {
  // swallowed — response already sent above
}
reply.status(201).send({ created: body.items.length })
```

**Groundability:** the empty `catch {}` block is added lines in the same handler hunk as D3-1.

---

## PR 4 — `feat/analytics-dashboard` (performance)

**Branch:** `feat/analytics-dashboard`
**Title:** "Add analytics dashboard endpoint"
**Body:**
> GET /workspaces/:id/analytics returns per-project task completion rates, comment counts,
> and overdue task ratios. Uses a migration to add a `completed_at` column to tasks.
> The dashboard also fetches external benchmark data to normalise scores.

**Approximate diff:** ~140 added lines, 5 files.

**Files touched:**

| File | Change |
|---|---|
| `src/db/schema.ts` | Add `completedAt: timestamp('completed_at')` column to tasks |
| `src/db/migrations/0002_analytics.sql` | `ALTER TABLE tasks ADD COLUMN completed_at timestamptz;` — no index |
| `src/modules/analytics/routes.ts` | New file: `GET /workspaces/:id/analytics` |
| `src/modules/analytics/service.ts` | New file: N+1 queries, O(n²) join, transaction-across-fetch, over-fetch |
| `src/index.ts` | Register analytics plugin |

---

### Planted defects (PR 4)

#### D4-1 — DB transaction held across outbound HTTP fetch [CRITICAL / perf]

**File:** `src/modules/analytics/service.ts`
**Intended severity:** CRITICAL
**Category:** perf
**Kind:** connection_leak

**What to write:** the service wraps the entire analytics computation in a `db.transaction()`
call, and inside that callback it performs an outbound `fetch()` to an external benchmarking
endpoint. This holds a database connection from the 10-connection pool for the entire duration
of the HTTP call (potentially seconds or indefinitely on timeout), starving other requests.

```ts
// planted (wrong):
async function getAnalytics(workspaceId: string) {
  return db.transaction(async (tx) => {
    const projects = await tx.select().from(projectsTable).where(...)
    // holds the connection across a potentially slow network call
    const benchmarks = await fetch('https://benchmarks.internal/v1/scores').then(r => r.json())
    return projects.map(p => ({ ...p, benchmark: benchmarks[p.id] }))
  })
}
```

**Groundability:** the `fetch()` call is inside the `db.transaction()` callback — both are
added lines in a ≤ 25-line function hunk.

---

#### D4-2 — Nested N+1: projects → tasks → comments [WARNING / perf]

**File:** `src/modules/analytics/service.ts`
**Intended severity:** WARNING
**Category:** perf
**Kind:** n_plus_1

**What to write:** for each project, a separate query fetches its tasks; for each task, a
separate query fetches its comments. With P projects and T tasks per project this issues
1 + P + P×T queries.

```ts
// planted (wrong):
for (const project of projects) {
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.projectId, project.id))
  for (const task of tasks) {
    const comments = await db.select().from(commentsTable).where(eq(commentsTable.taskId, task.id))
    task.commentCount = comments.length
  }
}
```

**Groundability:** the nested for-loops are added lines in a ≤ 20-line block hunk.

---

#### D4-3 — Over-fetch then JS filter [WARNING / perf]

**File:** `src/modules/analytics/service.ts`
**Intended severity:** WARNING
**Category:** perf
**Kind:** over_fetch

**What to write:** the service fetches all task columns (`SELECT *`) from every project, then
filters for `status === 'done'` in JavaScript instead of adding a `WHERE status = 'done'`
clause to the SQL query.

```ts
// planted (wrong):
const allTasks = await db.select().from(tasksTable).where(eq(tasksTable.projectId, id))
const doneTasks = allTasks.filter(t => t.status === 'done')
```

**Groundability:** the `filter()` call and the unfiltered SELECT are added lines in the same
function hunk.

---

#### D4-4 — Migration adds filtered column with no index [WARNING / perf]

**File:** `src/db/migrations/0002_analytics.sql`
**Intended severity:** WARNING
**Category:** perf
**Kind:** missing_index

**What to write:** the migration adds `completed_at` but the analytics query filters on it
(`WHERE completed_at IS NOT NULL`) and no index is created.

```sql
-- planted (wrong):
ALTER TABLE tasks ADD COLUMN completed_at timestamptz;
-- missing: CREATE INDEX tasks_completed_at_idx ON tasks (completed_at);
```

> **Groundability note:** SQL files are **not** indexed by DevDigest (indexer covers only
> `.ts/.js` etc.). This defect tests whether the model reasons about the migration from the
> diff text alone. It will appear in the raw diff but will fail the grounding gate because the
> file path is `.sql`, not `.ts`. **Expected: not grounded.** Do not count it toward the
> expected score; include it to verify grounding precision.

---

#### D4-5 — O(n²) in-memory join [WARNING / perf]

**File:** `src/modules/analytics/service.ts`
**Intended severity:** WARNING
**Category:** perf
**Kind:** quadratic_algorithm

**What to write:** two result arrays are joined with a nested loop instead of a Map lookup.

```ts
// planted (wrong):
const result = projects.map(project => ({
  ...project,
  taskCount: tasks.filter(t => t.projectId === project.id).length,
}))
```

**Groundability:** the nested `filter()` inside `map()` is an added line in a ≤ 15-line hunk.

---

#### D4-6 — Unpaginated list endpoint [SUGGESTION / perf]

**File:** `src/modules/analytics/routes.ts`
**Intended severity:** SUGGESTION
**Category:** perf
**Kind:** unbounded_response

**What to write:** `GET /workspaces/:id/analytics` returns data for every project in the
workspace with no pagination. A workspace with thousands of projects will return a multi-MB
response.

**Groundability:** the route handler's `reply.send(data)` is an added line in a ≤ 10-line hunk,
and there is no `limit`/`offset` parameter in the Zod query schema.

---

## PR 5 — `feat/api-key-auth` (security, saturated)

**Branch:** `feat/api-key-auth`
**Title:** "Add API key authentication and task search"
**Body:**
> External integrations need machine-to-machine auth. This PR adds API keys stored in a new
> `api_keys` table, a task search endpoint, webhook dispatch for task events, and a membership
> role update endpoint. JWT preHandler is updated to also accept `X-API-Key` headers.

**Approximate diff:** ~160 added lines, 6 files.

**Files touched:**

| File | Change |
|---|---|
| `src/db/schema.ts` | Add `api_keys` and `webhooks` tables |
| `src/modules/auth/service.ts` | Add API key hashing + verification; JWT secret fallback |
| `src/modules/auth/routes.ts` | Updated preHandler with auth-fails-open bug |
| `src/modules/tasks/repo.ts` | Add `searchTasks()` with `sql.raw`; add `getTaskById()` without workspace filter |
| `src/modules/tasks/routes.ts` | Add `GET /tasks/search` and `GET /tasks/:id` endpoints |
| `src/modules/workspaces/routes.ts` | Add `PATCH /workspaces/:id/members/:userId` with mass assignment |
| `src/adapters/webhooks.ts` | New file: dispatch webhook on task events (SSRF) |

---

### Planted defects (PR 5)

Seven OWASP-mapped defects. The score saturates at 0 regardless of how many are found; the
metric is **recall** — how many of the seven are surfaced after grounding.

#### D5-1 — Cross-tenant task read (no workspaceId filter) [CRITICAL / security / A01]

**File:** `src/modules/tasks/repo.ts`
**Intended severity:** CRITICAL
**Category:** security
**OWASP:** A01 Broken Access Control

**What to write:** a new `getTaskById(taskId)` function looks up a task by ID only, with no
workspace scope. Any authenticated user can read any task in any workspace.

```ts
// planted (wrong):
export async function getTaskById(taskId: string) {
  const rows = await db.select().from(tasks).where(eq(tasks.id, taskId))
  if (rows.length === 0) throw errors.notFound('Task')
  return rows[0]
}
```

**Groundability:** the entire function is new (added lines), ≤ 8 lines.

---

#### D5-2 — API keys stored as SHA-1 with `===` compare [CRITICAL / security / A02]

**File:** `src/modules/auth/service.ts`
**Intended severity:** CRITICAL
**Category:** security
**OWASP:** A02 Cryptographic Failures

**What to write:** API keys are hashed with Node's `crypto.createHash('sha1')` before storage,
and compared with `===` rather than `crypto.timingSafeEqual`.

```ts
// planted (wrong):
import { createHash } from 'crypto'

export function hashApiKey(key: string) {
  return createHash('sha1').update(key).digest('hex')  // SHA-1, broken
}

export function verifyApiKey(input: string, stored: string) {
  return hashApiKey(input) === stored  // timing side channel
}
```

**Groundability:** both functions are added lines, ≤ 10 lines total.

---

#### D5-3 — `sql.raw` string interpolation in search [CRITICAL / security / A03]

**File:** `src/modules/tasks/repo.ts`
**Intended severity:** CRITICAL
**Category:** security
**OWASP:** A03 Injection

**What to write:** the search query is built by interpolating the user-supplied `q` parameter
directly into `sql.raw()`.

```ts
// planted (wrong):
export async function searchTasks(workspaceId: string, q: string) {
  return db.execute(
    sql.raw(`SELECT * FROM tasks WHERE workspace_id = '${workspaceId}' AND title LIKE '${q}%'`)
  )
}
```

**Groundability:** the `sql.raw` call is an added line in a ≤ 8-line function hunk.

---

#### D5-4 — SSRF via user-supplied webhook URL [CRITICAL / security / A10]

**File:** `src/adapters/webhooks.ts`
**Intended severity:** CRITICAL
**Category:** security
**OWASP:** A10 Server-Side Request Forgery

**What to write:** webhook delivery fetches the user-configured URL with no allowlist, no
scheme check, and no hostname validation, allowing requests to internal metadata endpoints.

```ts
// planted (wrong):
export async function dispatch(webhookUrl: string, payload: unknown) {
  await fetch(webhookUrl, {   // user controls the URL — SSRF
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
```

**Groundability:** `webhooks.ts` is a new file — every line is added. Function is ≤ 10 lines.

---

#### D5-5 — JWT secret fallback to hardcoded dev value [WARNING / security]

**File:** `src/modules/auth/service.ts`
**Intended severity:** WARNING
**Category:** security

**What to write:** the JWT secret is read from the environment with a `??` fallback to a
hardcoded string. If `JWT_SECRET` is unset in production, the app silently uses a known-weak
secret.

```ts
// planted (wrong):
const secret = process.env['JWT_SECRET'] ?? 'dev-secret-change-me'
```

**Groundability:** the assignment is an added line in a module-level initialisation block.

---

#### D5-6 — Mass assignment on membership role update [CRITICAL / security / A01]

**File:** `src/modules/workspaces/routes.ts`
**Intended severity:** CRITICAL
**Category:** security
**OWASP:** A01 Broken Access Control (privilege escalation)

**What to write:** the membership update handler passes `req.body` directly to
`db.update(memberships).set(req.body)`, allowing any authenticated user to set
`role: 'owner'` on any membership.

```ts
// planted (wrong):
fastify.patch('/workspaces/:id/members/:userId', async (req, reply) => {
  await db.update(memberships).set(req.body as any).where(
    and(eq(memberships.workspaceId, req.params.id), eq(memberships.userId, req.params.userId))
  )
  reply.send({ ok: true })
})
```

**Groundability:** the `set(req.body)` call is an added line in a ≤ 12-line handler hunk.

---

#### D5-7 — Auth preHandler fails open on JWT error [CRITICAL / security]

**File:** `src/modules/auth/routes.ts`
**Intended severity:** CRITICAL
**Category:** security

**What to write:** the updated preHandler logs the JWT verification error and returns without
sending a response, which in Fastify 5 allows the request to proceed to the next handler
unauthenticated.

```ts
// planted (wrong):
fastify.addHook('preHandler', async (req, reply) => {
  try {
    await req.jwtVerify()
  } catch (err) {
    fastify.log.error({ err }, 'JWT verification failed')
    return   // ← no reply.status(401).send() — request continues
  }
})
```

**Groundability:** the `return` statement is an added line in the catch block of a ≤ 10-line
hook hunk.

---

## PR 6 — `refactor/notification-service` (large, cross-file, strategy experiment)

**Branch:** `refactor/notification-service`
**Title:** "Refactor notification service: digest emails and scheduled delivery"
**Body:**
> Extract email digest logic into a standalone function. Add a scheduler that runs every
> minute via setInterval. Update the response contract to include pagination metadata.
> This touches the notification service, its callers, the job scheduler, and the contracts.

**Approximate diff:** > 400 added+changed lines, 7 files. `auto` strategy must select
map-reduce (total changed lines > 400 AND files > 1 — see constraint in `00-OVERVIEW.md`).

**Files touched:**

| File | Change |
|---|---|
| `src/modules/notifications/service.ts` | Major refactor: `sendDigest(userId)` → `sendDigest(userId, workspaceId, options)` |
| `src/modules/notifications/repo.ts` | Rewritten: adds `markDigestSent()` check-then-insert |
| `src/modules/notifications/routes.ts` | Updated: response shape changed |
| `src/modules/tasks/service.ts` | Has a stale `sendDigest(userId)` call not updated to new signature |
| `src/contracts/notifications.ts` | New file: defines `NotificationListResponseSchema` |
| `src/platform/jobs.ts` | Add `setInterval` digest scheduler |
| `src/db/schema.ts` | Add `digest_sends` table: `id`, `user_id`, `workspace_id`, `sent_at` |

---

### Planted defects (PR 6)

#### D6-1 — Stale call site after signature change [CRITICAL / bug]

**Files:** `src/modules/notifications/service.ts` AND `src/modules/tasks/service.ts`
**Intended severity:** CRITICAL
**Category:** bug
**Kind:** cross_file_signature_change

**What to write:**
- In `notifications/service.ts` (added lines): `sendDigest` is refactored to accept
  `(userId: string, workspaceId: string, options: DigestOptions)`.
- In `tasks/service.ts` (modified line): the existing call `await notifications.sendDigest(userId)`
  is not updated. TypeScript will catch this at compile time, but the building agent must
  introduce the type error deliberately (the typecheck gate is for `main` only; PR branches
  are expected to have this compile error as a planted defect).

**Groundability:**
- The new signature in `notifications/service.ts` is on added lines — groundable.
- The stale call in `tasks/service.ts` is a modified line (the import or call changed) — groundable.
- This defect is only visible when both files are read together, making it the key
  test for whether map-reduce (which processes files independently) misses it.

---

#### D6-2 — Response shape drifts from Zod contract [WARNING / bug]

**File:** `src/modules/notifications/routes.ts`
**Intended severity:** WARNING
**Category:** bug
**Kind:** schema_mismatch

**What to write:** `contracts/notifications.ts` defines the response as
`z.object({ items: z.array(NotificationSchema), total: z.number() })`, but the route handler
returns `{ notifications: rows, count: rows.length }` — wrong keys, Zod validation is
bypassed (no `reply.validate` in Fastify 5 by default).

```ts
// planted (wrong — keys differ from contract):
reply.send({ notifications: rows, count: rows.length })

// contract expects:
// { items: Notification[], total: number }
```

**Groundability:** the `reply.send(...)` line is a modified line in a ≤ 10-line handler hunk.

---

#### D6-3 — Check-then-insert TOCTOU with no unique constraint [WARNING / bug]

**File:** `src/modules/notifications/repo.ts`
**Intended severity:** WARNING
**Category:** bug
**Kind:** toctou

**What to write:** `markDigestSent` checks whether a digest has already been sent for a
`(user_id, workspace_id, date)` triple with a SELECT, then inserts — outside a transaction
and without a unique constraint on those columns, creating a TOCTOU race on concurrent
requests.

```ts
// planted (wrong):
export async function markDigestSent(userId: string, workspaceId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const existing = await db.select().from(digestSends)
    .where(and(eq(digestSends.userId, userId), eq(digestSends.workspaceId, workspaceId)))
  if (existing.length > 0) return  // race: another request can insert between here...
  await db.insert(digestSends).values({ userId, workspaceId, sentAt: new Date() })  // ...and here
}
```

**Groundability:** the check and insert are added lines in a ≤ 15-line function hunk.

---

#### D6-4 — `setInterval` with no overlap guard or error boundary [WARNING / bug]

**File:** `src/platform/jobs.ts`
**Intended severity:** WARNING
**Category:** bug
**Kind:** cron_safety

**What to write:** the digest scheduler runs `sendDigests()` every 60 seconds with a bare
`setInterval`. If `sendDigests()` takes longer than 60 s, multiple invocations overlap. If
it throws, the uncaught exception propagates and kills the interval permanently (no more
digest emails until restart).

```ts
// planted (wrong):
setInterval(sendDigests, 60_000)  // no overlap guard, no error boundary

// correct would be:
let running = false
setInterval(async () => {
  if (running) return
  running = true
  try { await sendDigests() } catch (err) { log.error(err) } finally { running = false }
}, 60_000)
```

**Groundability:** the `setInterval(sendDigests, 60_000)` line is an added line in a ≤ 8-line
module hunk.

---

### Strategy experiment instructions (PR 6)

Run DevDigest on PR 6 three times and record results:

| Run | Strategy | Expected |
|---|---|---|
| A | `single-pass` | Should find D6-1 (cross-file) + D6-2 + D6-3 + D6-4 |
| B | `map-reduce` | Will likely miss D6-1 (cross-file invisible to per-file passes) |
| C | `auto` | Same as map-reduce (> 400 lines, > 1 file triggers map-reduce) |

Also record whether repo-intel's "Callers of changed symbols" digest (which lists call sites of
modified functions) compensates for map-reduce's blindness in run B.

---

## PR 7 — `feat/ai-task-summarizer` (optional — lethal trifecta)

**Branch:** `feat/ai-task-summarizer`
**Title:** "Add AI-powered task summarizer"
**Body:**
> Adds a POST /tasks/:id/summarize endpoint. Collects the task's comments (untrusted user
> input), passes them to an LLM stub along with workspace metadata, and posts the summary to
> a user-configured webhook URL.

**Approximate diff:** ~60 lines, 3 files.

**Files touched:**

| File | Change |
|---|---|
| `src/adapters/llm.ts` | New stub: `callLlm(prompt: string): Promise<string>` returns canned string |
| `src/modules/tasks/routes.ts` | Add `POST /tasks/:id/summarize` |
| `src/modules/tasks/service.ts` | `summarizeTask()`: collects comments, calls LLM, posts to webhook |

**Purpose:** exercises the `kind: 'lethal_trifecta'` finding kind with `trifecta_components`
and `evidence`. The trifecta: task comments (untrusted input) → LLM (prompt injection) →
user-configurable webhook (exfiltration path) alongside workspace data (private data leak).

---

## PR 8 — docs and config only (optional)

**Branch:** `chore/update-readme`
**Title:** "Update README and add VSCode settings"
**Body:**
> Adds setup instructions to README.md and a .vscode/settings.json for editor configuration.

**Files touched:** `README.md`, `.vscode/settings.json` — no `.ts` files.

**Purpose:** verifies that DevDigest returns `approve` with 0 findings when nothing indexable
changed.
