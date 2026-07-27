# 03 — Answer Key

> **KEEP THIS FILE OUT OF THE DEMO REPO.**
>
> This document records expected verdicts, scores, and per-defect expectations so that
> DevDigest output can be scored automatically. If this file is present in the demo repo it
> will appear in the repo map and may leak expected answers into the reviewer's context,
> corrupting the benchmark.

---

## Scoring formula (reference)

```
score = clamp(100 − 35 × CRITICAL − 12 × WARNING − 3 × SUGGESTION,  0, 100)
```

Computed **after grounding**. A finding that fails the grounding gate does not affect the
score. Ungrounded findings still count against precision.

---

## Expected verdicts and scores

| PR | Branch | Verdict | CRITICAL | WARNING | SUGGESTION | Score |
|---|---|---|---|---|---|---|
| 1 | `chore/task-pagination` | `approve` | 0 | 0 | 0 | **100** |
| 2 | `fix/overdue-filter` | `request_changes` | 1 | 2 | 1 | **38** |
| 3 | `feat/bulk-import` | `request_changes` | 1 | 3 | 0 | **29** |
| 4 | `feat/analytics-dashboard` | `request_changes` | 1 | 3 | 1 | **26** |
| 5 | `feat/api-key-auth` | `request_changes` | 6 | 1 | 0 | **0** (saturated) |
| 6 | `refactor/notification-service` | `request_changes` | 1 | 3 | 0 | **29** |

Score calculations:

- **PR 2:** 100 − 35(1) − 12(2) − 3(1) = 100 − 35 − 24 − 3 = **38**
- **PR 3:** 100 − 35(1) − 12(3) − 3(0) = 100 − 35 − 36 = **29**
- **PR 4:** 100 − 35(1) − 12(3) − 3(1) = 100 − 35 − 36 − 3 = **26**
  *(D4-4, the migration index, is in a `.sql` file — fails grounding gate — not counted)*
- **PR 5:** 100 − 35(6) − 12(1) = 100 − 210 − 12 = **−122 → 0**
- **PR 6:** 100 − 35(1) − 12(3) − 3(0) = 100 − 35 − 36 = **29**

---

## Per-PR defect map

### PR 1 — Expected findings: none

No planted defects. Any finding produced by DevDigest is a **false positive**.

---

### PR 2 — Expected findings: 1C + 2W + 1S

| Defect ID | File | Severity | Category | Expected to be found? |
|---|---|---|---|---|
| D2-1 | `src/modules/tasks/repo.ts` | CRITICAL | bug | **Yes** |
| D2-2 | `src/modules/tasks/repo.ts` | WARNING | bug | **Yes** |
| D2-3 | `src/modules/tasks/repo.ts` | WARNING | bug | **Yes** |
| D2-4 | `test/tasks.test.ts` | SUGGESTION | test | **Yes** |
| (canary) `\|\|` vs `??` | `src/modules/tasks/repo.ts` | — | — | **No** (below threshold) |

If the model surfaces the `||` vs `??` issue as WARNING or higher, log it as a precision error
(false positive at that severity).

---

### PR 3 — Expected findings: 1C + 3W

| Defect ID | File | Severity | Category | Expected to be found? |
|---|---|---|---|---|
| D3-1 | `src/modules/tasks/routes.ts` | CRITICAL | bug | **Yes** |
| D3-2 | `src/modules/tasks/repo.ts` | WARNING | bug | **Yes** |
| D3-3 | `src/modules/tasks/repo.ts` | WARNING | perf | **Yes** |
| D3-4 | `src/modules/tasks/routes.ts` | WARNING | bug | **Yes** |

---

### PR 4 — Expected findings: 1C + 3W + 1S

| Defect ID | File | Severity | Category | Expected to be found? |
|---|---|---|---|---|
| D4-1 | `src/modules/analytics/service.ts` | CRITICAL | perf | **Yes** |
| D4-2 | `src/modules/analytics/service.ts` | WARNING | perf | **Yes** |
| D4-3 | `src/modules/analytics/service.ts` | WARNING | perf | **Yes** |
| D4-4 | `src/db/migrations/0002_analytics.sql` | WARNING | perf | **No** (`.sql` file, fails grounding) |
| D4-5 | `src/modules/analytics/service.ts` | WARNING | perf | **Yes** |
| D4-6 | `src/modules/analytics/routes.ts` | SUGGESTION | perf | **Yes** |

D4-4 may appear in DevDigest's raw output (model reasons about migrations from the diff text),
but must fail the grounding gate. Count it as **ungrounded** if it appears — a finding with
`file: 'src/db/migrations/0002_analytics.sql'` cannot be grounded. This tests grounding
precision.

---

### PR 5 — Expected findings: 6C + 1W (score 0, metric is recall)

| Defect ID | File | Severity | Category | OWASP | Expected to be found? |
|---|---|---|---|---|---|
| D5-1 | `src/modules/tasks/repo.ts` | CRITICAL | security | A01 | **Yes** |
| D5-2 | `src/modules/auth/service.ts` | CRITICAL | security | A02 | **Yes** |
| D5-3 | `src/modules/tasks/repo.ts` | CRITICAL | security | A03 | **Yes** |
| D5-4 | `src/adapters/webhooks.ts` | CRITICAL | security | A10 | **Yes** |
| D5-5 | `src/modules/auth/service.ts` | WARNING | security | — | **Yes** |
| D5-6 | `src/modules/workspaces/routes.ts` | CRITICAL | security | A01 | **Yes** |
| D5-7 | `src/modules/auth/routes.ts` | CRITICAL | security | — | **Yes** |

**Recall formula:** `found_after_grounding / 7`. Target: ≥ 5/7 for a strong result.

The score is always 0 for this PR. The score metric is meaningless here; use recall instead.

---

### PR 6 — Expected findings: 1C + 3W (strategy experiment)

| Defect ID | File | Severity | Category | Visible to map-reduce? |
|---|---|---|---|---|
| D6-1 (signature) | `src/modules/notifications/service.ts` | CRITICAL | bug | **Partial** (sees new sig but not stale caller) |
| D6-1 (stale caller) | `src/modules/tasks/service.ts` | — | bug | **Partial** (sees stale call but not new sig) |
| D6-2 | `src/modules/notifications/routes.ts` | WARNING | bug | **Yes** |
| D6-3 | `src/modules/notifications/repo.ts` | WARNING | bug | **Yes** |
| D6-4 | `src/platform/jobs.ts` | WARNING | bug | **Yes** |

D6-1 counts as one CRITICAL finding. It requires reading both files together.

---

## Four benchmark experiments

### Experiment 1 — False-positive rate (PR 1)

**Question:** Does DevDigest produce findings on a clean, correctly implemented PR?

**Method:** run DevDigest on `chore/task-pagination`.

**Pass criterion:** 0 findings, verdict `approve`, score 100.

**Failure interpretation:**
- Any CRITICAL → reviewer is over-aggressive on correct code.
- Any WARNING → investigate whether the finding is a genuine issue in the PR code or
  hallucinated.

---

### Experiment 2 — Agent differentiation (PR 4)

**Question:** Does the Performance reviewer outperform the General reviewer on a
performance-heavy diff?

**Method:** run DevDigest on `feat/analytics-dashboard` with General reviewer and
Performance reviewer separately.

**Scoring:**

| Metric | General reviewer | Performance reviewer |
|---|---|---|
| D4-1 (CRITICAL perf) found? | Expected: maybe | Expected: **yes** |
| D4-2 N+1 (WARNING perf) found? | Expected: maybe | Expected: **yes** |
| D4-3 over-fetch (WARNING perf) found? | Expected: maybe | Expected: **yes** |
| D4-5 O(n²) (WARNING perf) found? | Expected: unlikely | Expected: **yes** |
| D4-6 unpaginated (SUGGESTION perf) found? | Expected: maybe | Expected: **yes** |

A Performance reviewer recall > General reviewer recall on this PR validates reviewer
specialisation. A difference of ≤ 1 finding suggests the reviewers are not sufficiently
differentiated.

---

### Experiment 3 — Security recall (PR 5)

**Question:** How many of the seven OWASP-mapped defects does DevDigest surface?

**Method:** run DevDigest on `feat/api-key-auth`. For each produced finding, check:

1. Does `file` match the planted defect's file?
2. Does `[start_line, end_line]` intersect the hunk's new-side lines?
3. Does the finding description name the correct vulnerability class?

**Recall per agent type:**

| Reviewer | Expected recall |
|---|---|
| General | ≥ 3/7 |
| Security | ≥ 5/7 |

A Security reviewer recall < 3/7 indicates a failure mode worth investigating.

---

### Experiment 4 — Strategy comparison (PR 6)

**Question:** Does map-reduce miss cross-file defects that single-pass finds?

**Method:** run DevDigest on `refactor/notification-service` three times:

| Run | Strategy override | Key question |
|---|---|---|
| A | `single-pass` | Does it find D6-1 (stale caller in tasks/service.ts)? |
| B | `map-reduce` | Does it miss D6-1? Does it find D6-2/3/4? |
| C | `auto` (no override) | Does it match run B (auto should select map-reduce)? |

**Expected results:**

- Run A: finds all four defects (1C + 3W), score 29.
- Run B: misses D6-1 (CRITICAL), finds D6-2/3/4 (3W), score 64.
- Run C: same as run B (auto triggers map-reduce because > 400 lines and > 1 file).

**Repo-intel rescue check:** in run B and C, inspect whether the "Callers of changed symbols"
section of the repo map digest lists `tasks/service.ts` as a caller of `sendDigest`. If it
does, check whether the model uses that information to flag the stale call despite the
map-reduce blindness. A model that successfully uses repo-intel to bridge the gap would produce
findings from both files in map-reduce mode — record this as a capability note.

---

## Category coverage matrix

All five finding categories must appear at least once across the PR set.

| Category | PR(s) | Representative defect |
|---|---|---|
| `bug` | PR 2, PR 3, PR 6 | D2-1 (off-by-one), D3-1 (forEach async), D6-1 (stale caller) |
| `security` | PR 5 | D5-1 through D5-7 |
| `perf` | PR 3, PR 4 | D3-3 (sequential inserts), D4-1 (txn across fetch) |
| `test` | PR 2 | D2-4 (it.skip) |
| `style` | — | *(no dedicated style defect; the canary `\|\|` vs `??` in PR 2 can be classed `style` if surfaced)* |

> Note: `style` is intentionally sparse. The seeded prompts de-prioritise style findings
> (they are SUGGESTION-level at most). If no `style` finding appears across all PRs, that is
> acceptable; the category coverage goal is "reachable", not "guaranteed".

---

## Notes on grounding precision

The following planted defects are expected to **fail** the grounding gate and must not appear
in the expected score calculation:

| Defect | Reason |
|---|---|
| D4-4 (migration index) | File is `.sql` — not indexed, path will not match `+++ b/src/db/migrations/…` for `.ts`-only grounding |

If any produced finding has a file path pointing to a non-`.ts` file (e.g. `.sql`, `.yml`,
`.md`), log it as **ungrounded** and exclude it from recall and score calculations.
