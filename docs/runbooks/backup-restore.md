# PostgreSQL backup and restore verification

## Backup controls

- Run with a dedicated backup role and TLS certificate verification.
- Encrypt backups in transit and at rest.
- Upload to storage with retention and deletion protection appropriate to financial records.
- Keep backup credentials separate from API and migrator credentials.
- Alert when backup creation, upload or retention verification fails.

## Restore drill

1. Select a backup through an approved change record.
2. Restore only into an isolated non-production target.
3. Verify schemas, row counts, foreign keys and migration checksums.
4. Run the journal-integrity query and confirm every active transaction balances.
5. Run application smoke tests and financial-statement reconciliation.
6. Measure recovery point and recovery time against approved targets.
7. Destroy the isolated target securely after evidence is retained.

## Journal-integrity verification

```sql
SELECT id_transaccion,
       SUM(COALESCE(debe, 0)) AS debe,
       SUM(COALESCE(haber, 0)) AS haber
FROM contabilidad.transaccion_movimiento_cuenta
WHERE LOWER(COALESCE(estado_registro, 'Activo')) = 'activo'
GROUP BY id_transaccion
HAVING SUM(COALESCE(debe, 0)) <> SUM(COALESCE(haber, 0));
```

A production release is blocked when this query returns any row.
