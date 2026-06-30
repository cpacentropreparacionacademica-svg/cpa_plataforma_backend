# Patch 011: venta-clase sin fiscal, apertura y lifecycle

Archivo de migración:

```txt
docs/db/migrations/011_patch_venta_clase_sin_fiscal_apertura_lifecycle.sql
```

## Decisiones

- No se modifican migraciones ya aplicadas para evitar fallo de checksum en Render.
- Las cuentas fiscales se inactivan, no se borran físicamente.
- El flujo `venta-clase` no registra IVA ni crédito fiscal.
- Se crea `contabilidad.transaccion_venta` como cabecera comercial de venta.
- Se conserva `contabilidad.transaccion_detalle_venta` como detalle por línea.
- Se agrega balance de apertura Mayo 2026 con asiento balanceado.

## Asiento de apertura

```txt
Fecha: 2026-05-31
Subtipo: BALANCE_APERTURA_MAY26
Debe: 446695.24
Haber: 446695.24
```

Los importes provienen de la hoja `MAY26` del archivo `ESTADOS FINANCIEROS.xlsx`.
