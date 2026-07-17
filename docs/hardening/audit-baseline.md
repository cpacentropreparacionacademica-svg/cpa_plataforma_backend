# Hardening audit baseline

## Scope

The audit covers the active NestJS/TypeScript backend, deployment scripts, database migration/backup tooling, and committed repository artefacts. Legacy JavaScript code is treated as attack surface until proven unreachable and removed.

## Confirmed high-priority findings

| ID | Severity | Finding | Production impact | Required action |
|---|---|---|---|---|
| SEC-001 | Critical | Secrets were committed to a public repository. | Credential theft, unauthorised data access, destructive backup/restore access. | Rotate/revoke, investigate, purge history, scan all refs. |
| SUP-001 | High | `node_modules`, package caches, generated PnP files, and TypeScript build state were tracked. | Supply-chain ambiguity, repository bloat, stale executable code, slow CI/review. | Remove generated/vendor artefacts and install from lockfile. |
| AUTH-001 | Critical | Passwords use unsalted SHA-256. | Fast offline cracking after database disclosure. | Introduce memory-hard salted hashing and migrate on successful login. |
| AUTH-002 | High | Password-reset tokens use `Math.random()` and the endpoint reveals whether a user exists. | Guessable tokens and account enumeration. | Use cryptographic randomness and uniform responses. |
| MEM-001 | High | In-memory rate-limit maps have no eviction or size bound. | Unbounded heap growth under high-cardinality requests. | Add expiry cleanup and a hard capacity. |
| CFG-001 | High | Production configuration is not validated before bootstrap. | Insecure fallback values, wildcard credentialed CORS, invalid TTL/pool settings. | Fail fast with a typed configuration schema. |
| TLS-001 | High | PostgreSQL TLS disables certificate verification whenever SSL is enabled. | Database man-in-the-middle risk. | Verify certificates by default; allow explicit, documented exception only. |
| API-001 | High | Unknown request fields are silently stripped and CORS defaults to reflecting all origins. | Hidden client errors and credentialed cross-origin exposure. | Reject unknown fields and require explicit production origins. |
| ERR-001 | High | Unexpected exception messages are returned to clients. | Internal data and implementation disclosure. | Log server-side with request ID; return a generic message. |
| ARCH-001 | High | Active TypeScript coexists with duplicate legacy Express/Sequelize JavaScript implementations. | Ambiguous runtime, inconsistent controls, accidental insecure imports. | Prove reachability and remove inactive duplicate code. |
| CODE-001 | High | Several manual files exceed the 300-line rule, including files above 1,100 lines. | High change risk, weak testability, difficult review. | Split by cohesive business responsibility. |
| FIN-001 | High | Accounting controls are concentrated in one oversized service and lack a published control matrix. | Increased risk of unbalanced, mutable, unauthorised, or unauditable postings. | Separate posting/reversal/import logic and add control evidence. |

## Evidence limitations

Static review can identify code and configuration defects but cannot prove production safety. Runtime load, database permissions, restored-backup integrity, hosting controls, and accounting policy approval require environment-specific evidence.
