# Security policy

## Supported branch

Security fixes are prepared in `HARDENING` and merged into `main` only after review and automated verification.

## Reporting a vulnerability

Do not open a public issue containing credentials, personal data, exploit details, or production URLs. Report the finding privately to the repository owner and include:

- affected version or commit;
- reproduction steps with non-production data;
- impact and preconditions;
- proposed mitigation, when known.

The owner should acknowledge a valid report, contain active exposure, rotate affected credentials, and publish a remediation record without exposing sensitive details.

## Secret handling

Secrets must be supplied by the deployment platform or an approved secret manager. They must never be committed, copied into examples, logged, or embedded in build artifacts. A secret committed at any point is considered compromised even after the file is deleted.
