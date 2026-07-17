# ADR 0001: Preserve TypeORM during security hardening

- **Status:** Accepted for the hardening branch
- **Context:** The existing NestJS application uses raw parameterised PostgreSQL queries through TypeORM `DataSource`. Project guidance normally prefers Sequelize, but an ORM migration would alter hundreds of persistence paths during a security-critical remediation.
- **Decision:** Preserve TypeORM for this branch. Harden connection configuration, transactions, query timeouts, allow-lists, and mapping boundaries. Evaluate an ORM migration separately with contract tests and measured operational benefit.
- **Consequences:** This avoids combining a broad data-access rewrite with credential, authentication, and accounting-control fixes. TypeORM remains an explicit deviation from the default project profile, not an endorsement of mixed ORMs.
