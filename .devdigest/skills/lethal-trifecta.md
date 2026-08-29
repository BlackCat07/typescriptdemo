# Lethal trifecta

Flag a change that brings all three of these together in one execution path:

1. **Private data access** — reads secrets, user records, or internal APIs.
2. **Untrusted input** — a PR body, issue text, web page, file, or model output
   reaches that path.
3. **An exfil path** — the result can leave: an outbound request, a webhook, a
   log line shipped off-box, a rendered link.

All three, in one path, is CRITICAL: untrusted text can steer the code into
sending private data somewhere the author did not intend.

Two of the three is at most a WARNING, and say which leg is missing. This
combination is rare — classify conservatively rather than labelling every fetch
call a trifecta.