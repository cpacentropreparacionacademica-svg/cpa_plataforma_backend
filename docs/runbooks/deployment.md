# Production deployment runbook

## Preconditions

- The exact release commit has green build, test, CodeQL and dependency checks.
- The Gitleaks history scan is green after repository-history cleanup.
- All credentials exposed before hardening have been rotated and verified invalid.
- Migration 014 has been rehearsed against a recent production-like restore.
- Accounting and security owners have approved the residual-risk register.

## Deployment sequence

1. Create and verify a database backup; record its immutable identifier.
2. Put deployment variables in the platform secret store. Never place values in files or command history.
3. Run `node scripts/migrate-prod.js` using the dedicated migrator role.
4. Deploy the image built from the reviewed commit digest.
5. Wait for `/api/health/live`, then `/api/health/ready`.
6. Run authentication, permission and accounting smoke tests with synthetic accounts.
7. Verify logs and metrics contain the release identifier and no secrets or personal data.
8. Re-enable normal traffic and monitor error, latency, pool, Redis and database-lock signals.

## Rollback

- Roll back application code to the last verified image digest when the schema remains backward compatible.
- Do not reverse accounting records by deleting data. Use an approved forward migration or accounting reversal.
- Restore the database only after an incident commander and data owner approve the recovery point and impact.
- Record the failed release, evidence and corrective action.
