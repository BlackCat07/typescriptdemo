# Secret leakage gate

Flag any credential material introduced by the diff.

- Provider key shapes: `sk_live`, `sk-`, `service_role`, `ghp_`, `github_pat_`,
  AWS `AKIA` ids, and any 32+ char high-entropy literal assigned to a name
  containing key/token/secret/password.
- A secret in a `NEXT_PUBLIC_` variable is CRITICAL regardless of its shape: that
  prefix ships the value to the browser bundle.
- A real value committed to `.env.example`, a test fixture, or a snapshot counts.
  "It is only a test key" is not a mitigation — rotate-ability is the point.
- A placeholder that is obviously not a credential (`your-key-here`, `xxx`) is not
  a finding.

Cite the exact file and line. Say what to do: remove the literal, read it from the
secrets provider, and rotate the exposed value.