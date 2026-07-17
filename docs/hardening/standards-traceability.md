# International standards traceability

| Reference | Relevant expectation | Backend treatment | Status |
|---|---|---|---|
| OWASP ASVS 5.0.0 | Verifiable authentication, session, access-control, validation, error and configuration controls | Opaque sessions, scrypt, origin checks, strict DTO handling, redacted errors, bounded rate limiting | Implemented in code; formal ASVS test evidence pending CI/e2e |
| NIST SSDF 1.1 | Prepare, protect, produce and respond practices across the SDLC | Secret incident plan, phased commits, CI gate, dependency/secret scanning plan, residual-risk register | Partially implemented |
| ISO/IEC 27001:2022 | Risk-based information-security management | Technical controls and incident actions documented | Organisational ISMS/certification outside repository scope |
| ISO 22301:2019 | Continuity capability and recovery evidence | Readiness, graceful shutdown, backup/restore runbook and required drill | Restore drill pending |
| ISO 15489-1:2016 | Authentic, reliable, integral and usable records | Posted accounting records are non-destructive and reversals preserve history | Retention schedule and source-document controls pending |
| COSO Internal Control Framework | Control environment, risk assessment, control activities, information and monitoring | Double-entry constraints, permission checks and control-gap matrix | Segregation, approval and monitoring ownership pending |
| IFRS Accounting Standards | Entity-specific recognition, measurement, presentation and disclosure | Technical ledger supports controlled double-entry; no accounting-policy claims encoded | Professional policy mapping pending |
| IFRS Accounting Taxonomy 2025 | Digital concepts for IFRS reports used for 2026 annual reporting | Mapping/export architecture documented as a gap | Not implemented |
| XBRL 2.1 and Dimensions 1.0 | Valid interoperable report instances and dimensional contexts | No XBRL instance generation in current backend | Not implemented |

## Verification rule

A row marked “implemented” means the repository contains a corresponding technical control. It does not mean the organisation has obtained certification, legal conformity or an audit opinion. Every external compliance claim requires scoped evidence, control ownership and independent review.
