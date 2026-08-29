# Edge case coverage

For each function the diff adds or changes, work out its boundaries and check the
tests reach them.

- Empty and absent: `[]`, `""`, `null`, `undefined`, a missing optional field.
- Numeric edges: 0, negative, the exact limit, one past the limit, overflow.
- Collections: a single element, duplicates, an unsorted input where order matters.
- Time and ordering: a second call before the first resolves, a retry, an expired
  token, a clock that moved backwards.
- Failure: the dependency throws, times out, or returns a shape the code did not
  expect.

Name the specific boundary and the input that reaches it — "add edge case tests"
is not a finding. If a boundary is genuinely unreachable, say why instead of
reporting it.

Severity is SUGGESTION for a missing boundary on a pure function, WARNING when
the unhandled boundary can reach production data.