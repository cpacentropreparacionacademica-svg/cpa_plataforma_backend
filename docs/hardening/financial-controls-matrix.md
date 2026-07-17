# Financial and accounting control matrix

## Scope and interpretation

This matrix reviews the backend against internationally recognised reporting, internal-control, security, continuity and records-management references. It is a technical control map, **not a certification or a legal/accounting opinion**. Final production approval requires an authorised accountant, the entity's governance owner and applicable Bolivian legal/tax review.

## Reference set

- IFRS Accounting Standards for recognition, measurement, presentation and disclosure policy.
- IFRS Accounting Taxonomy for digital representation of IFRS disclosures; the IFRS Foundation identifies the 2025 taxonomy as the current annual taxonomy for 2026 reporting.
- XBRL 2.1 and XBRL Dimensions 1.0 for interoperable financial-reporting instances and dimensional context.
- COSO Internal Control—Integrated Framework for control environment, risk assessment, control activities, information/communication and monitoring.
- ISO/IEC 27001:2022 for information-security management.
- ISO 22301:2019 for business continuity.
- ISO 15489-1:2016 for records-management concepts and controls.
- OWASP ASVS 5.0.0 and NIST SSDF 1.1 for application-security and secure-development verification.

## Implemented technical controls

| Control objective | Implementation in HARDENING | Evidence |
|---|---|---|
| Every journal has at least two valid lines | Service validation plus database constraint requiring exactly one positive debit/credit side per line | Accounting service and migration 014 |
| Debits equal credits | Existing transactional posting plus deferred database constraint trigger evaluated at commit | Migration 014 |
| Atomic posting | Header and lines are written inside one database transaction | `crearTransaccionConMovimientos` and sale-posting flows |
| No destructive journal correction | Database triggers reject DELETE and economic-field mutation; corrections use reverse entries | Migration 014 and reversal endpoint |
| Referential and chronological audit context | Creator/modifier identifiers and timestamps retained; reversal creates a new journal | Existing schema plus hardening trigger policy |
| Least exposure of financial data | Authentication, permission guard, secure sessions, CSRF origin control and generic 500 responses | Security hardening commits |
| Operational integrity | Bounded pools, query timeout, readiness endpoint, graceful shutdown and migration advisory lock/runbook | Runtime hardening and migration runner |
| Credential protection | Salted scrypt hashes with controlled legacy upgrade; secrets removed from the current tree | Authentication hardening and incident runbook |
| Record retention | Repository policy prohibits application-level deletion of posted journals | Migration 014 |

## Production blockers requiring domain decisions

| Gap | Why it matters | Required owner/evidence |
|---|---|---|
| Accounting periods and close/reopen workflow are not formally modelled | Prevents controlled cut-off and post-close posting | Accountant-approved period rules, roles and test cases |
| Journal approval and segregation of duties are not fully demonstrated | One actor may prepare and post incompatible activities | COSO control owner, role matrix and approval audit evidence |
| Reversal linkage is descriptive rather than enforced by a dedicated foreign key | Weakens traceability between original and reversal | Schema decision and migration approved by accounting owner |
| Multi-currency rate source, timestamp and rounding policy are not formalised | Can create inconsistent measurement and revaluation | Treasury/accounting policy and authoritative rate source |
| Reconciliation workflow and exception ageing are not modelled | Unreconciled balances may remain undetected | Reconciliation cases, evidence retention and escalation SLA |
| Source-document hash and immutable attachment retention are not proven | Journal evidence can become disconnected from source records | Records policy, object-storage retention/WORM strategy |
| IFRS presentation/disclosure mappings are not configured | A chart of accounts alone does not establish IFRS-compliant statements | Accountant-approved mapping and disclosure checklist |
| XBRL instance generation and taxonomy validation are absent | No standards-based digital report interchange | Taxonomy mapping, validation suite and filing profile |
| Backup restoration has not been evidenced in the target production environment | Backups without restore evidence do not satisfy continuity | Timed restore drill, RPO/RTO results and sign-off |

## Mandatory accounting release tests

1. Reject one-sided, zero, negative and unbalanced journals at both API and database layers.
2. Commit balanced journals with two and more lines atomically.
3. Roll back the complete journal when any line fails.
4. Reject UPDATE/DELETE of posted economic values through every database role used by the application.
5. Create a reverse journal whose lines exactly invert the original and preserve both records.
6. Prove that unauthorised roles cannot post, reverse, export or modify journals.
7. Test concurrent posting, duplicate requests and retry behaviour with a documented idempotency key strategy.
8. Reconcile trial balance, general ledger, balance sheet and income statement from the same cut-off data.
9. Restore a backup into an isolated environment and repeat integrity queries before release.

## Conclusion

The hardening migration materially improves double-entry integrity and immutability. The backend must not be represented as IFRS-, XBRL-, COSO- or ISO-compliant until the listed organisational, accounting and evidence gaps are closed and independently approved.
