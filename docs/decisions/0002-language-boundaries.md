# ADR 0002: English identifiers with Spanish compatibility at system boundaries

- **Status:** Accepted
- **Context:** The database schema and existing public API use Spanish names such as `id_persona`, `fecha_registro`, `debe` and `haber`. Renaming those fields in-place would break persisted data, SQL migrations and frontend contracts.
- **Decision:** All new local variables, private functions, services and infrastructure types use English names. Spanish identifiers remain only where they are part of an approved database column, accounting term, route, DTO or compatibility response. Boundary mappers may expose both forms during a versioned migration.
- **Consequences:** New implementation code is readable in English without pretending that a destructive contract rename is safe. Existing Spanish internals are migrated only when their enclosing module is refactored with contract tests.
- **Prohibited shortcut:** Do not rename database columns or public JSON properties solely for style. Such a change requires a migration, compatibility period, OpenAPI update and consumer verification.
