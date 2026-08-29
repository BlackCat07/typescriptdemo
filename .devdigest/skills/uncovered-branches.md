# Uncovered branches

Every branch the diff introduces should have a test that takes it.

- A new `if` / `else` / ternary / `switch` arm.
- An early return or a guard clause.
- A `catch`, and any error path that changes the response.
- A short-circuit that hides work: `a && b()`, `x ?? fallback()`.

For each uncovered branch name the file, the condition, and the input that would
enter it. Do not report a coverage percentage and do not ask for tests on renames,
moves or formatting.

Severity is SUGGESTION for a branch whose both sides are trivially safe, WARNING
when the untested branch is the error-handling path — that is the one that only
runs when something has already gone wrong.