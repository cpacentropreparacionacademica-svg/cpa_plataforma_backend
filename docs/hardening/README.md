# CPA backend hardening programme

This branch applies production hardening in small, reviewable phases. A phase is complete only when its changes, tests, and unresolved risks are documented.

## Phase 0 — Containment and baseline

- remove committed secrets and generated/vendor artifacts;
- sanitize configuration examples;
- record the credential-rotation and history-rewrite requirement;
- establish the audit baseline and production gates.

## Phase 1 — Runtime and resource efficiency

- validate environment configuration before startup;
- bound in-memory fallbacks and database pools;
- add graceful shutdown and request-size limits;
- make health/readiness checks represent real dependencies.

## Phase 2 — Application security

- replace unsalted SHA-256 password storage with versioned `scrypt` hashes while supporting controlled legacy upgrades;
- strengthen session, cookie, origin, CORS, error, and rate-limit handling;
- prevent user enumeration and insecure action-token generation;
- add security-focused tests.

## Phase 3 — Clean code and maintainability

- remove inactive duplicate JavaScript runtime implementations;
- split oversized active TypeScript files by cohesive responsibility;
- use English identifiers internally while preserving Spanish database/API compatibility at boundaries;
- document architectural decisions and exceptions.

## Phase 4 — Accounting and financial integrity

- enforce balanced, atomic, append-only journal behaviour;
- protect posted entries from destructive mutation;
- define period, reversal, audit, reconciliation, retention, and export controls;
- map implementation controls to IFRS reporting, XBRL, COSO, ISO, OWASP, and NIST guidance without claiming certification.

## Phase 5 — Verification and production gate

- add CI for frozen dependency installation, formatting, type checking, linting, tests, build, dependency audit, and secret scanning;
- provide deployment, backup/restore, observability, and rollback runbooks;
- publish residual risks and objective acceptance evidence.

## Non-negotiable release gate

The branch is not production-ready until exposed credentials are rotated, repository history is cleaned, CI is green, restore testing succeeds, and accounting controls are approved by an authorised accounting professional.
