# 00 — Overview and Handoff Instructions

## Scope guard (read this first)

This repo is a **test fixture**, not a product. Its only job is to be a plausible-looking
TypeScript codebase that hosts six pull requests whose defects are known in advance.

Binding sizing rule: **≈ 28 files, ≈ 1 400 lines on `main`.**

The lever that keeps it small: anything a PR introduces does not need to exist in `main`.
`analytics/`, `api_keys`, `webhooks`, the audit log, the AI summariser — these are all
created *by* PRs 3–7, so none of them belong in the baseline. `main` needs only the seven
modules the PRs *modify*.

### Non-goals (do not add any of the following)

| Category | Excluded items |
|---|---|
| UI | No frontend, no HTML, no template engine |
| Auth providers | No OAuth, no SAML, no Passport.js |
| Infrastructure | No Dockerfile, no Kubernetes manifests, no deployment config |
| Observability | No OpenTelemetry, no Datadog, no Prometheus, no logging middleware |
| Docs generation | No Swagger / OpenAPI, no typedoc |
| CI | No GitHub Actions workflows, no lint-staged, no Husky |
| Storage | No S3, no file uploads |
| Rate limiting | No throttle/rate-limit middleware |
| Seed data | No seed scripts beyond what a unit test needs |
| Live DB | The app must typecheck and unit tests must pass; it does not need to run against a real Postgres instance |
| LLM adapter | The AI summariser used by optional PR 7 is a stub that returns a canned string — no real API calls |

Any code not directly needed by one of the seven baseline modules or one of the six PR diffs
is out of scope. When in doubt, leave it out.

---

## Purpose of this fixture

The fixture is a benchmark for **DevDigest**, an AI code-review system. The benchmark
measures three properties:

| Property | Question |
|---|---|
| **Recall** | Did DevDigest find the defects that were deliberately planted? |
| **Precision** | Did DevDigest invent findings that do not exist? |
| **Grounding** | Did real findings survive the file-path / line-range gate? |

The answer key (`03-ANSWER-KEY.md`, which stays in *this* repo and is never copied into the
demo repo) records the expected verdict, score, and finding counts for each PR so that
DevDigest's output can be scored automatically.

---

## DevDigest hard constraints

These constraints drive every design decision in the specs below. The building agent must
respect them.

### 1  Indexer

Only `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` files are indexed. `MAX_INDEXED_FILES = 5000`,
`MAX_FILE_SIZE = 400 KB`. SQL migrations and YAML files are ignored by the indexer — defects
planted there are invisible to the reviewer.

**Consequence:** every planted defect must live in a `.ts` file.

### 2  Stack

All three seeded reviewers assume **Node + TypeScript ESM + Fastify 5 + Drizzle/Postgres + Zod
+ Octokit**. Build exactly this stack; do not substitute alternatives (e.g. no Prisma, no
Express, no Hono).

### 3  Grounding gate

A finding survives only when:
- `file` matches the diff's `+++ b/<path>` header **exactly** (no leading slash, no repo
  prefix), and
- `[start_line, end_line]` intersects at least one hunk's new-side line range.

**Consequences:**
- Every planted defect must sit on an **added or modified line inside a small hunk** — not in
  deleted lines, not in unmodified context.
- Keep flawed functions short (≤ 30 added lines) so the model's line estimate lands inside the
  covered range (the model reads a raw unified diff with no absolute line numbers — it counts
  forward from `@@` headers).

### 4  Scoring formula

```
score = clamp(100 − 35 × CRITICAL − 12 × WARNING − 3 × SUGGESTION, 0, 100)
```

Computed *after* grounding. Findings that fail the grounding gate do not affect the score.

### 5  Strategy selection

`auto` selects **map-reduce** only when `total_changed_lines > 400 AND changed_files > 1`.
Otherwise `single-pass` is used. PR 6 is deliberately sized to trigger map-reduce so the
strategy experiment is valid.

### 6  Dependency-cruiser / repo map

A root `tsconfig.json` with `paths` configured is required for dependency-cruiser to resolve
`@app/*` path aliases. Without it the import graph, PageRank, and repo map all degrade. This
file must be present in `main` before the first PR branch is cut.

### 7  Default branch

DevDigest hardcodes `'main'` and never reads the default branch from GitHub. The repo's
default branch **must** be `main`.

### 8  Injection guard

The injection guard neutralises "this is a test fixture" disclaimers, so the repo can carry
honest comments (e.g. `// stub`) without suppressing findings. The answer key must stay out of
the demo repo to prevent it from leaking into a diff or the repo map.

### 9  PR size

Each PR must touch fewer than 100 files (`listFiles` uses `per_page: 100`, unpaginated). PR 6
is the largest at ~7 files.

### 10  Five finding categories

DevDigest recognises: `bug`, `security`, `perf`, `style`, `test`. All five must appear at least
once across the PR set so every reviewer path is exercised.

---

## Handoff instructions for the building agent

1. **Read all four spec documents** (`00` through `03`) before writing a single line of code.
2. **Build `main` first.** Follow `01-APP-SPEC.md` exactly: seven modules, six tables, every
   endpoint, the folder layout, and the config file contents listed there.
3. **Run the baseline quality-bar checklist** (in `01-APP-SPEC.md`) to verify `main` is clean
   before cutting any PR branch. `tsc --noEmit` and `vitest run` must both exit 0.
4. **Cut PR branches from `main`**, one per entry in `02-PR-CATALOG.md`. Each branch is
   independent (all six open simultaneously). Apply exactly the defects listed — do not add
   extra improvements or fixes.
5. **Do not copy `03-ANSWER-KEY.md` into the demo repo.** It must stay in the spec repo only.
6. **Do not add anything not listed in the specs.** The fixture must be small. Resist the urge
   to make the app "more realistic".
