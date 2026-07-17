# Accounting production review checklist

## Database

- Migration 014 applies successfully to a production-like copy and validates all existing journal lines.
- No existing journal violates one-sided debit/credit or balance constraints.
- Runtime writer cannot DELETE posted journal headers or movements.
- Migration role is separate from runtime writer and reader roles.
- Transaction isolation and lock behaviour are tested under concurrent posting.

## Application

- All posting routes require explicit permissions.
- Bulk size limits are enforced and do not keep unbounded request data in memory.
- Every multi-table financial use case uses one transaction.
- Error responses do not disclose SQL, credentials or personal data.
- Retryable requests have an approved idempotency design before automatic retries are enabled.

## Accounting sign-off

- Chart of accounts and statement mappings are approved.
- Period-close, reversal, approval and segregation-of-duties policies are approved.
- Tax, currency, rounding and cut-off rules are approved for Bolivia and the entity's reporting basis.
- Trial balance and financial statements reconcile against a signed reference dataset.
- Retention, source-document and audit-evidence requirements are approved.

## Operations

- Restore drill meets documented RPO/RTO.
- Database and application alerts have owners and escalation paths.
- Credential-rotation incident is closed with evidence.
- CI, migration, smoke and security checks are green for the exact release commit.
