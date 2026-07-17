# Clean-code and naming review

## Completed in HARDENING

- Removed the inactive root Express/Sequelize/JWT/SHA runtime and obsolete middleware tree. The supported runtime is now unambiguously NestJS/TypeScript.
- Added a source-size gate: new TypeScript files cannot exceed 300 lines and approved legacy exceptions cannot grow.
- New security and infrastructure code uses English identifiers, small functions, explicit contracts and bounded side effects.
- Preserved Spanish accounting concepts and database/API names only at compatibility boundaries, as recorded in ADR 0002.
- Replaced generic error disclosure and unbounded state with focused services and typed request context.

## Remaining controlled debt

Four active files remain above the 300-line production standard. They are listed in `source-size-exceptions.json` with a no-growth ceiling and explicit decomposition target. They were not mechanically split in the same commit as authentication and financial-integrity changes because doing so without complete contract coverage would increase production risk.

Required follow-up sequence:

1. Characterisation tests for every public accounting, shared CRUD and metadata endpoint.
2. Extract pure monetary and validation functions first.
3. Split orchestration by use case, preserving transaction boundaries.
4. Replace the resource mega-registry with domain registries composed at bootstrap.
5. Remove each exception immediately when its file is below 300 lines.

## Naming rule

English is mandatory for new implementation identifiers. Spanish remains valid for legally recognised accounting terms (`debe`, `haber`), persisted schema columns and existing API contracts. Mappers isolate those boundary names from internal application language.
