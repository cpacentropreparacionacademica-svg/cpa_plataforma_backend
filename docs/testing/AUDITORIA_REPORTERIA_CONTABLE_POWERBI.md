# Auditoría técnica - Reportería contable PowerBI

## Cambio aplicado

Se agregó el endpoint especializado:

```http
GET /api/reporteria/contabilidad/powerbi-movimientos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&fechaCorte=YYYY-MM-DD
```

También acepta el alias `fecha_corte`.

## Decisiones de calidad

- El frontend de reportería no debe construir estados contables consumiendo múltiples CRUD.
- El endpoint consulta una sola fuente de lectura: `contabilidad.v_powerbi_contable_movimiento`.
- La consulta devuelve movimientos hasta `fechaCorte`, no solo el rango `desde/hasta`, para permitir Balance General y saldo inicial de Flujo de Caja.
- Se devuelven `metadata`, `movimientos` y `data.metadata`/`data.movimientos` para compatibilidad con el envelope general del backend.
- La metadata incluye `cuentasEfectivo`, `cuentas_efectivo`, `cuentasDisponible` y `cuentas_disponible`.

## Cuentas de efectivo/disponible

El endpoint arma las cuentas de efectivo desde:

1. `contabilidad.configuracion_cuenta_operativa.codigo IN ('CANAL_COBRO_EFECTIVO', 'CANAL_COBRO_QR')`.
2. Cuentas activas del grupo/código disponible `1.1.01.*`.

Esto permite que el frontend cuadre flujo de caja con efectivo, QR y equivalentes al disponible sin quemar códigos en el cliente.

## Validaciones

- `desde`, `hasta` y `fechaCorte` son obligatorios.
- Formato estricto `YYYY-MM-DD`.
- `desde <= hasta`.
- `fechaCorte >= hasta`.

## Corrección adicional crítica

Se corrigió el script `scripts/backup-postgres.js`: el cleanup previo del restore ahora incluye `public` con `DROP SCHEMA IF EXISTS public CASCADE`, porque antes el dump podía fallar al intentar limpiar funciones antiguas de `public` sin cascade.
