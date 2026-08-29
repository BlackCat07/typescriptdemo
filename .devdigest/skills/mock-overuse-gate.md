# Mock overuse gate

A test that mocks the thing it is testing asserts only that the mock was called.
Flag tests in the diff that verify their own scaffolding.

- The unit under test is itself mocked or stubbed.
- Every collaborator is mocked and the only assertions are `toHaveBeenCalled` /
  `toHaveBeenCalledWith` — the test would still pass if the implementation
  returned nothing.
- A mock hard-codes a response shape that no longer matches the real contract, so
  the test survives a breaking change.
- A pure function is mocked instead of being called.

Mocking the network, the clock, the filesystem and the LLM is correct and is NOT a
finding — this repo's own tests do exactly that.

Say which collaborator should be real, and what the test would then prove.
Severity is WARNING when the test cannot fail for the reason it exists.