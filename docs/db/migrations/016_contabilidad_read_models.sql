-- Migration: 016_contabilidad_read_models.sql
-- Propósito: crear la capa de lectura contable como objetos versionados de base de datos.
--
-- Motivo: `docs/db/ddl.views.sql` define vistas de reportería pero NINGÚN proceso lo
-- aplica (no lo referencian scripts/, render.yaml, Dockerfile ni package.json). En
-- consecuencia `contabilidad.v_powerbi_contable_movimiento` no existe en ninguna base
-- construida con migraciones, y `GET /api/reporteria/contabilidad/powerbi-movimientos`
-- fallaba siempre con «relation does not exist».
--
-- Criterio de diseño (por qué vistas y no otra cosa):
--   * `v_movimiento_contable` es una VISTA SQL porque resuelve un join estable de cuatro
--     tablas (transaccion → movimiento → cuenta → grupo_cuenta) reutilizado por todos los
--     libros y estados financieros. No se materializa: el volumen es moderado, el join
--     es por clave primaria indexada y los libros deben reflejar el asiento al instante.
--   * Los reportes con rango de fechas (diario, mayor, balance, resultados) NO son vistas:
--     dependen de parámetros y permisos, y se resuelven en query services sobre esta base.
--     Ver docs/architecture y CPA_ACCOUNTING_AUDIT_AND_READ_VIEWS_PLAN.md.
--
-- Idempotente.

-- ---------------------------------------------------------------------------
-- 1. Base del modelo de lectura: un movimiento contable por fila, clasificado
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW contabilidad.v_movimiento_contable AS
SELECT
    asiento.id_transaccion,
    movimiento.id_movimiento,

    asiento.fecha_transaccion,
    date_trunc('month', asiento.fecha_transaccion)::date AS periodo_inicio,
    (date_trunc('month', asiento.fecha_transaccion)::date
      + INTERVAL '1 month' - INTERVAL '1 day')::date      AS periodo_fin,
    EXTRACT(YEAR  FROM asiento.fecha_transaccion)::int     AS anio,
    EXTRACT(MONTH FROM asiento.fecha_transaccion)::int     AS mes,

    asiento.tipo_transaccion::text AS tipo_transaccion,
    asiento.sub_tipo_transaccion,
    asiento.glosa,
    asiento.id_transaccion_revertida,
    (asiento.id_transaccion_revertida IS NOT NULL) AS es_reversion,

    cuenta.id_cuenta,
    cuenta.codigo       AS codigo_cuenta,
    cuenta.nombre_cuenta,

    grupo.id_grupo_cuenta,
    grupo.codigo AS codigo_grupo_cuenta,
    grupo.nombre AS nombre_grupo_cuenta,
    grupo.tipo   AS tipo_reporte,   -- BALANCE / RESULTADOS
    grupo.sub_tipo,                 -- ACTIVO / PASIVO / PATRIMONIO / INGRESO / GASTO
    grupo.sub_grupo,
    grupo.orden_reporte,

    movimiento.debe,
    movimiento.haber,
    (movimiento.debe - movimiento.haber) AS saldo_deudor,

    -- Saldo en la naturaleza de la cuenta: positivo significa "aumenta el saldo natural".
    CASE
        WHEN grupo.sub_tipo IN ('ACTIVO', 'GASTO')                 THEN movimiento.debe - movimiento.haber
        WHEN grupo.sub_tipo IN ('PASIVO', 'PATRIMONIO', 'INGRESO') THEN movimiento.haber - movimiento.debe
        ELSE movimiento.debe - movimiento.haber
    END AS saldo_natural,

    CASE
        WHEN grupo.sub_tipo IN ('ACTIVO', 'GASTO')                 THEN 'DEUDOR'
        WHEN grupo.sub_tipo IN ('PASIVO', 'PATRIMONIO', 'INGRESO') THEN 'ACREEDOR'
        ELSE 'SIN_CLASIFICAR'
    END AS naturaleza_saldo,

    asiento.id_sucursal,
    asiento.id_centro_costo_mapa,
    asiento.id_cliente,
    asiento.id_usuario_creador,
    asiento.fecha_registro

FROM contabilidad.transaccion AS asiento
JOIN contabilidad.transaccion_movimiento_cuenta AS movimiento
  ON movimiento.id_transaccion = asiento.id_transaccion
JOIN contabilidad.cuenta AS cuenta
  ON cuenta.id_cuenta = movimiento.id_cuenta
JOIN contabilidad.grupo_cuenta AS grupo
  ON grupo.id_grupo_cuenta = cuenta.id_grupo_cuenta
WHERE lower(COALESCE(asiento.estado_registro,    'activo')) = 'activo'
  AND lower(COALESCE(movimiento.estado_registro, 'activo')) = 'activo'
  AND lower(COALESCE(cuenta.estado_registro,     'activo')) = 'activo'
  AND lower(COALESCE(grupo.estado_registro,      'activo')) = 'activo';

COMMENT ON VIEW contabilidad.v_movimiento_contable IS
'Modelo de lectura base de contabilidad: un movimiento contabilizado por fila, con cuenta, grupo, clasificación de reporte y saldo en naturaleza. Fuente única de libros y estados financieros.';

-- Alias de compatibilidad: `ReporteriaContabilidadService` y los tableros Power BI
-- existentes consultan este nombre. Se conserva para no romper consumidores.
CREATE OR REPLACE VIEW contabilidad.v_powerbi_contable_movimiento AS
SELECT * FROM contabilidad.v_movimiento_contable;

COMMENT ON VIEW contabilidad.v_powerbi_contable_movimiento IS
'Alias de compatibilidad de contabilidad.v_movimiento_contable para consumidores Power BI existentes.';

-- ---------------------------------------------------------------------------
-- 2. Plan de cuentas para selectores y reportes jerárquicos
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW contabilidad.v_plan_cuentas AS
SELECT
    cuenta.id_cuenta,
    cuenta.codigo,
    cuenta.nombre_cuenta,
    grupo.id_grupo_cuenta,
    grupo.codigo AS codigo_grupo_cuenta,
    grupo.nombre AS nombre_grupo_cuenta,
    grupo.tipo   AS tipo_reporte,
    grupo.sub_tipo,
    grupo.sub_grupo,
    grupo.orden_reporte,
    CASE
        WHEN grupo.sub_tipo IN ('ACTIVO', 'GASTO')                 THEN 'DEUDOR'
        WHEN grupo.sub_tipo IN ('PASIVO', 'PATRIMONIO', 'INGRESO') THEN 'ACREEDOR'
        ELSE 'SIN_CLASIFICAR'
    END AS naturaleza_saldo,
    -- Una cuenta con movimientos no debe poder reclasificarse ni desactivarse a la ligera.
    EXISTS (
      SELECT 1
        FROM contabilidad.transaccion_movimiento_cuenta AS movimiento
       WHERE movimiento.id_cuenta = cuenta.id_cuenta
         AND lower(COALESCE(movimiento.estado_registro, 'activo')) = 'activo'
    ) AS tiene_movimientos,
    cuenta.estado_registro
FROM contabilidad.cuenta AS cuenta
JOIN contabilidad.grupo_cuenta AS grupo
  ON grupo.id_grupo_cuenta = cuenta.id_grupo_cuenta;

COMMENT ON VIEW contabilidad.v_plan_cuentas IS
'Plan de cuentas con clasificación de reporte, naturaleza de saldo e indicador de uso contable. Alimenta selectores y el mantenimiento del plan de cuentas.';

-- ---------------------------------------------------------------------------
-- 3. Integridad de asientos: apoyo a auditoría y checklist de cierre
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW contabilidad.v_asiento_integridad AS
SELECT
    asiento.id_transaccion,
    asiento.fecha_transaccion,
    asiento.tipo_transaccion::text AS tipo_transaccion,
    asiento.glosa,
    COUNT(movimiento.id_movimiento)                    AS lineas,
    COALESCE(SUM(movimiento.debe),  0)                 AS total_debe,
    COALESCE(SUM(movimiento.haber), 0)                 AS total_haber,
    COALESCE(SUM(movimiento.debe), 0) - COALESCE(SUM(movimiento.haber), 0) AS diferencia,
    (COALESCE(SUM(movimiento.debe), 0) = COALESCE(SUM(movimiento.haber), 0)
     AND COUNT(movimiento.id_movimiento) >= 2)         AS balanceado,
    contabilidad.fn_periodo_estado_en(asiento.fecha_transaccion) AS estado_periodo
FROM contabilidad.transaccion AS asiento
LEFT JOIN contabilidad.transaccion_movimiento_cuenta AS movimiento
       ON movimiento.id_transaccion = asiento.id_transaccion
      AND lower(COALESCE(movimiento.estado_registro, 'activo')) = 'activo'
WHERE lower(COALESCE(asiento.estado_registro, 'activo')) = 'activo'
GROUP BY asiento.id_transaccion, asiento.fecha_transaccion, asiento.tipo_transaccion, asiento.glosa;

COMMENT ON VIEW contabilidad.v_asiento_integridad IS
'Control de integridad por asiento: número de líneas, sumas de debe/haber, diferencia y estado del periodo. Permite detectar asientos descuadrados o sin movimientos antes de un cierre.';
