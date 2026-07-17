# Production readiness status

## Implemented and reviewable

- Current tree no longer contains the exposed `.env`, generated dependency trees or package caches.
- Runtime configuration fails closed for missing database credentials and unsafe production auth/cookie/CORS settings.
- PostgreSQL and Redis connections have bounded pools/timeouts and controlled shutdown.
- In-memory rate-limit fallback is capacity-bounded and login limits include a non-plaintext account key.
- Passwords use salted scrypt with opportunistic legacy SHA-256 migration.
- Reset tokens use cryptographic randomness, uniform responses and atomic one-time consumption.
- Cookie-authenticated writes enforce an approved Origin.
- Unexpected exceptions are logged with request ID and return a generic response.
- Accounting journal lines, balance and immutability are enforced at database level.
- CI, CodeQL, secret scan, container hardening and deployment/restore runbooks are present.

## Release blockers

1. Rotate every credential exposed in repository history and prove the old values fail.
2. Rewrite Git history and obtain a green full-history secret scan.
3. Obtain a green CI run for the exact release commit; resolve every type, lint, test, build and high dependency-audit failure.
4. Rehearse migration 014 on a recent production-like restore and resolve existing invalid journals.
5. Complete a timed backup restore and financial reconciliation.
6. Close or explicitly accept the accounting gaps in `financial-controls-matrix.md` with accountable owner signatures.
7. Refactor the four approved oversized files under characterisation tests, then remove their exceptions.

## Honest readiness statement

The HARDENING branch is suitable for focused review and remediation validation. It is **not yet approved for production** until every blocker above has objective evidence.
