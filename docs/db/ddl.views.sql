-- =========================================================
-- Views limpias para Power BI - Reportería contable
-- Motor: PostgreSQL
-- Objetivo:
--   - Eliminar las views anteriores del dashboard contable.
--   - Crear una base contable limpia para Libro Diario, Mayor y EEFF.
--   - No arrastrar cliente, producto, proveedor, tienda, empleado, etc.
-- =========================================================

BEGIN;

-- =========================================================
-- 1) ELIMINAR VIEWS ANTERIORES
-- =========================================================

-- Views anteriores generadas para dashboard contable
DROP VIEW IF EXISTS contabilidad.v_dashboard_eeff_resumen_mensual CASCADE;
DROP VIEW IF EXISTS contabilidad.v_dashboard_estado_resultados_mensual CASCADE;
DROP VIEW IF EXISTS contabilidad.v_dashboard_balance_general_mensual CASCADE;
DROP VIEW IF EXISTS contabilidad.v_dashboard_eeff_cuenta_mensual CASCADE;
DROP VIEW IF EXISTS contabilidad.v_dashboard_eeff_base_movimiento CASCADE;
DROP VIEW IF EXISTS contabilidad.v_dashboard_libro_mayor_resumen_cuenta CASCADE;
DROP VIEW IF EXISTS contabilidad.v_dashboard_libro_mayor_detalle CASCADE;
DROP VIEW IF EXISTS contabilidad.v_dashboard_libro_diario_resumen CASCADE;
DROP VIEW IF EXISTS contabilidad.v_dashboard_libro_diario_detalle CASCADE;

-- Views nuevas, por si ya existían de una ejecución previa
DROP VIEW IF EXISTS contabilidad.v_powerbi_resumen_financiero_mensual CASCADE;
DROP VIEW IF EXISTS contabilidad.v_powerbi_estado_resultados_mensual CASCADE;
DROP VIEW IF EXISTS contabilidad.v_powerbi_balance_general_mensual CASCADE;
DROP VIEW IF EXISTS contabilidad.v_powerbi_eeff_cuenta_mensual CASCADE;
DROP VIEW IF EXISTS contabilidad.v_powerbi_libro_mayor CASCADE;
DROP VIEW IF EXISTS contabilidad.v_powerbi_libro_diario_resumen CASCADE;
DROP VIEW IF EXISTS contabilidad.v_powerbi_libro_diario CASCADE;
DROP VIEW IF EXISTS contabilidad.v_powerbi_contable_movimiento CASCADE;

-- =========================================================
-- 2) BASE CONTABLE LIMPIA PARA POWER BI
--    Una fila por movimiento contable.
-- =========================================================

CREATE VIEW contabilidad.v_powerbi_contable_movimiento AS
SELECT
    t.id_transaccion,
    tm.id_movimiento,

    t.fecha_transaccion,
    date_trunc('month', t.fecha_transaccion)::date AS periodo_inicio,
    (date_trunc('month', t.fecha_transaccion)::date + INTERVAL '1 month' - INTERVAL '1 day')::date AS periodo_fin,
    EXTRACT(YEAR FROM t.fecha_transaccion)::int AS anio,
    EXTRACT(MONTH FROM t.fecha_transaccion)::int AS mes,

    t.tipo_transaccion::text AS tipo_transaccion,
    t.sub_tipo_transaccion,
    t.glosa,

    c.id_cuenta,
    c.codigo AS codigo_cuenta,
    c.nombre_cuenta,

    gc.id_grupo_cuenta,
    gc.codigo AS codigo_grupo_cuenta,
    gc.nombre AS nombre_grupo_cuenta,
    gc.tipo AS tipo_reporte,        -- BALANCE / RESULTADOS
    gc.sub_tipo,                    -- ACTIVO / PASIVO / PATRIMONIO / INGRESO / GASTO
    gc.sub_grupo,
    gc.orden_reporte,

    tm.debe::numeric(18,2) AS debe,
    tm.haber::numeric(18,2) AS haber,
    (tm.debe - tm.haber)::numeric(18,2) AS saldo_deudor,

    CASE
        WHEN gc.sub_tipo IN ('ACTIVO', 'GASTO')
            THEN (tm.debe - tm.haber)::numeric(18,2)
        WHEN gc.sub_tipo IN ('PASIVO', 'PATRIMONIO', 'INGRESO')
            THEN (tm.haber - tm.debe)::numeric(18,2)
        ELSE (tm.debe - tm.haber)::numeric(18,2)
    END AS saldo_natural,

    CASE
        WHEN gc.sub_tipo IN ('ACTIVO', 'GASTO') THEN 'DEUDOR'
        WHEN gc.sub_tipo IN ('PASIVO', 'PATRIMONIO', 'INGRESO') THEN 'ACREEDOR'
        ELSE 'SIN_CLASIFICAR'
    END AS naturaleza_saldo

FROM contabilidad.transaccion t
JOIN contabilidad.transaccion_movimiento_cuenta tm
    ON tm.id_transaccion = t.id_transaccion
JOIN contabilidad.cuenta c
    ON c.id_cuenta = tm.id_cuenta
JOIN contabilidad.grupo_cuenta gc
    ON gc.id_grupo_cuenta = c.id_grupo_cuenta
WHERE lower(COALESCE(t.estado_registro, 'activo')) = 'activo'
  AND lower(COALESCE(tm.estado_registro, 'activo')) = 'activo'
  AND lower(COALESCE(c.estado_registro, 'activo')) = 'activo'
  AND lower(COALESCE(gc.estado_registro, 'activo')) = 'activo';

COMMENT ON VIEW contabilidad.v_powerbi_contable_movimiento IS
'Base limpia para Power BI: una fila por movimiento contable. Incluye fecha, glosa, cuenta, grupo cuenta, debe, haber y saldos contables. No incluye cliente/producto/proveedor/tienda.';

-- =========================================================
-- 3) LIBRO DIARIO
--    Para Power BI: detalle de asientos/movimientos.
-- =========================================================

CREATE VIEW contabilidad.v_powerbi_libro_diario AS
SELECT
    ROW_NUMBER() OVER (
        ORDER BY fecha_transaccion, id_transaccion, id_movimiento
    )::bigint AS nro_linea_diario,
    id_transaccion,
    id_movimiento,
    fecha_transaccion,
    periodo_inicio,
    periodo_fin,
    anio,
    mes,
    tipo_transaccion,
    sub_tipo_transaccion,
    glosa,
    id_cuenta,
    codigo_cuenta,
    nombre_cuenta,
    id_grupo_cuenta,
    codigo_grupo_cuenta,
    nombre_grupo_cuenta,
    tipo_reporte,
    sub_tipo,
    sub_grupo,
    orden_reporte,
    naturaleza_saldo,
    debe,
    haber,
    saldo_deudor,
    saldo_natural
FROM contabilidad.v_powerbi_contable_movimiento;

COMMENT ON VIEW contabilidad.v_powerbi_libro_diario IS
'Libro diario para Power BI: detalle de movimientos contables ordenables por fecha, transacción y movimiento.';

-- =========================================================
-- 4) LIBRO DIARIO RESUMEN
--    Una fila por asiento/transacción.
-- =========================================================

CREATE VIEW contabilidad.v_powerbi_libro_diario_resumen AS
SELECT
    id_transaccion,
    MIN(fecha_transaccion) AS fecha_transaccion,
    MIN(periodo_inicio) AS periodo_inicio,
    MIN(periodo_fin) AS periodo_fin,
    MIN(anio) AS anio,
    MIN(mes) AS mes,
    MIN(tipo_transaccion) AS tipo_transaccion,
    MIN(sub_tipo_transaccion) AS sub_tipo_transaccion,
    MIN(glosa) AS glosa,
    COUNT(*)::int AS cantidad_movimientos,
    SUM(debe)::numeric(18,2) AS total_debe,
    SUM(haber)::numeric(18,2) AS total_haber,
    (SUM(debe) - SUM(haber))::numeric(18,2) AS diferencia_cuadre,
    CASE
        WHEN ABS(SUM(debe) - SUM(haber)) < 0.005 THEN 'CUADRADO'
        ELSE 'DESCUADRADO'
    END AS estado_cuadre
FROM contabilidad.v_powerbi_contable_movimiento
GROUP BY id_transaccion;

COMMENT ON VIEW contabilidad.v_powerbi_libro_diario_resumen IS
'Resumen del libro diario: una fila por asiento, con total debe, total haber y validación de cuadre.';

-- =========================================================
-- 5) LIBRO MAYOR
--    Movimientos por cuenta con acumulados.
-- =========================================================

CREATE VIEW contabilidad.v_powerbi_libro_mayor AS
SELECT
    ROW_NUMBER() OVER (
        PARTITION BY id_cuenta
        ORDER BY fecha_transaccion, id_transaccion, id_movimiento
    )::bigint AS nro_linea_mayor,

    id_cuenta,
    codigo_cuenta,
    nombre_cuenta,
    id_grupo_cuenta,
    codigo_grupo_cuenta,
    nombre_grupo_cuenta,
    tipo_reporte,
    sub_tipo,
    sub_grupo,
    orden_reporte,
    naturaleza_saldo,

    id_transaccion,
    id_movimiento,
    fecha_transaccion,
    periodo_inicio,
    periodo_fin,
    anio,
    mes,
    tipo_transaccion,
    sub_tipo_transaccion,
    glosa,

    debe,
    haber,
    saldo_deudor,
    saldo_natural,

    SUM(debe) OVER (
        PARTITION BY id_cuenta
        ORDER BY fecha_transaccion, id_transaccion, id_movimiento
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )::numeric(18,2) AS debe_acumulado,

    SUM(haber) OVER (
        PARTITION BY id_cuenta
        ORDER BY fecha_transaccion, id_transaccion, id_movimiento
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )::numeric(18,2) AS haber_acumulado,

    SUM(saldo_deudor) OVER (
        PARTITION BY id_cuenta
        ORDER BY fecha_transaccion, id_transaccion, id_movimiento
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )::numeric(18,2) AS saldo_deudor_acumulado,

    SUM(saldo_natural) OVER (
        PARTITION BY id_cuenta
        ORDER BY fecha_transaccion, id_transaccion, id_movimiento
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )::numeric(18,2) AS saldo_natural_acumulado

FROM contabilidad.v_powerbi_contable_movimiento;

COMMENT ON VIEW contabilidad.v_powerbi_libro_mayor IS
'Libro mayor para Power BI: movimientos por cuenta con debe, haber y saldo acumulado.';

-- =========================================================
-- 6) EEFF MENSUAL POR CUENTA
--    Base mensual para Balance General y Estado de Resultados.
--    Genera filas por periodo y cuenta contable.
-- =========================================================

CREATE VIEW contabilidad.v_powerbi_eeff_cuenta_mensual AS
WITH periodos AS (
    SELECT DISTINCT
        periodo_inicio,
        periodo_fin,
        anio,
        mes
    FROM contabilidad.v_powerbi_contable_movimiento
),
cuentas_eeff AS (
    SELECT
        c.id_cuenta,
        c.codigo AS codigo_cuenta,
        c.nombre_cuenta,
        gc.id_grupo_cuenta,
        gc.codigo AS codigo_grupo_cuenta,
        gc.nombre AS nombre_grupo_cuenta,
        gc.tipo AS tipo_reporte,
        gc.sub_tipo,
        gc.sub_grupo,
        gc.orden_reporte,
        CASE
            WHEN gc.sub_tipo IN ('ACTIVO', 'GASTO') THEN 'DEUDOR'
            WHEN gc.sub_tipo IN ('PASIVO', 'PATRIMONIO', 'INGRESO') THEN 'ACREEDOR'
            ELSE 'SIN_CLASIFICAR'
        END AS naturaleza_saldo
    FROM contabilidad.cuenta c
    JOIN contabilidad.grupo_cuenta gc
        ON gc.id_grupo_cuenta = c.id_grupo_cuenta
    WHERE lower(COALESCE(c.estado_registro, 'activo')) = 'activo'
      AND lower(COALESCE(gc.estado_registro, 'activo')) = 'activo'
      AND gc.tipo IN ('BALANCE', 'RESULTADOS')
),
movimiento_mensual AS (
    SELECT
        periodo_inicio,
        id_cuenta,
        SUM(debe)::numeric(18,2) AS debe_mes,
        SUM(haber)::numeric(18,2) AS haber_mes,
        SUM(saldo_deudor)::numeric(18,2) AS saldo_deudor_mes,
        SUM(saldo_natural)::numeric(18,2) AS saldo_natural_mes
    FROM contabilidad.v_powerbi_contable_movimiento
    WHERE tipo_reporte IN ('BALANCE', 'RESULTADOS')
    GROUP BY periodo_inicio, id_cuenta
),
periodo_cuenta AS (
    SELECT
        p.periodo_inicio,
        p.periodo_fin,
        p.anio,
        p.mes,
        c.id_cuenta,
        c.codigo_cuenta,
        c.nombre_cuenta,
        c.id_grupo_cuenta,
        c.codigo_grupo_cuenta,
        c.nombre_grupo_cuenta,
        c.tipo_reporte,
        c.sub_tipo,
        c.sub_grupo,
        c.orden_reporte,
        c.naturaleza_saldo,
        COALESCE(m.debe_mes, 0)::numeric(18,2) AS debe_mes,
        COALESCE(m.haber_mes, 0)::numeric(18,2) AS haber_mes,
        COALESCE(m.saldo_deudor_mes, 0)::numeric(18,2) AS saldo_deudor_mes,
        COALESCE(m.saldo_natural_mes, 0)::numeric(18,2) AS saldo_natural_mes
    FROM periodos p
    CROSS JOIN cuentas_eeff c
    LEFT JOIN movimiento_mensual m
        ON m.periodo_inicio = p.periodo_inicio
       AND m.id_cuenta = c.id_cuenta
)
SELECT
    periodo_inicio,
    periodo_fin,
    anio,
    mes,
    id_cuenta,
    codigo_cuenta,
    nombre_cuenta,
    id_grupo_cuenta,
    codigo_grupo_cuenta,
    nombre_grupo_cuenta,
    tipo_reporte,
    sub_tipo,
    sub_grupo,
    orden_reporte,
    naturaleza_saldo,
    debe_mes,
    haber_mes,
    saldo_deudor_mes,
    saldo_natural_mes,

    SUM(saldo_natural_mes) OVER (
        PARTITION BY id_cuenta
        ORDER BY periodo_inicio
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )::numeric(18,2) AS saldo_natural_acumulado_total,

    SUM(saldo_natural_mes) OVER (
        PARTITION BY id_cuenta, anio
        ORDER BY periodo_inicio
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )::numeric(18,2) AS saldo_natural_acumulado_anual,

    CASE
        WHEN tipo_reporte = 'BALANCE' AND sub_tipo = 'ACTIVO' THEN 'ACTIVO'
        WHEN tipo_reporte = 'BALANCE' AND sub_tipo = 'PASIVO' THEN 'PASIVO'
        WHEN tipo_reporte = 'BALANCE' AND sub_tipo = 'PATRIMONIO' THEN 'PATRIMONIO'
        WHEN tipo_reporte = 'RESULTADOS' AND sub_tipo = 'INGRESO' THEN 'INGRESO'
        WHEN tipo_reporte = 'RESULTADOS' AND sub_tipo = 'GASTO' THEN 'GASTO'
        ELSE 'SIN_CLASIFICAR'
    END AS seccion_eeff
FROM periodo_cuenta;

COMMENT ON VIEW contabilidad.v_powerbi_eeff_cuenta_mensual IS
'Base mensual para EEFF en Power BI. Tiene una fila por periodo y cuenta; mantiene saldos acumulados para Balance y acumulado anual para Resultados.';

-- =========================================================
-- 7) BALANCE GENERAL MENSUAL
--    Activo, Pasivo y Patrimonio a una fecha.
-- =========================================================

CREATE VIEW contabilidad.v_powerbi_balance_general_mensual AS
SELECT
    periodo_inicio,
    periodo_fin,
    anio,
    mes,
    seccion_eeff AS seccion_balance,
    sub_grupo,
    id_grupo_cuenta,
    codigo_grupo_cuenta,
    nombre_grupo_cuenta,
    orden_reporte,
    id_cuenta,
    codigo_cuenta,
    nombre_cuenta,
    debe_mes,
    haber_mes,
    saldo_natural_mes,
    saldo_natural_acumulado_total AS saldo_balance
FROM contabilidad.v_powerbi_eeff_cuenta_mensual
WHERE tipo_reporte = 'BALANCE'
  AND seccion_eeff IN ('ACTIVO', 'PASIVO', 'PATRIMONIO');

COMMENT ON VIEW contabilidad.v_powerbi_balance_general_mensual IS
'Balance General mensual para Power BI. Usa saldo acumulado total porque las cuentas de balance son saldos a una fecha.';

-- =========================================================
-- 8) ESTADO DE RESULTADOS MENSUAL
--    Ingresos y Gastos por mes y acumulado anual.
-- =========================================================

CREATE VIEW contabilidad.v_powerbi_estado_resultados_mensual AS
SELECT
    periodo_inicio,
    periodo_fin,
    anio,
    mes,
    seccion_eeff AS seccion_resultado,
    sub_grupo,
    id_grupo_cuenta,
    codigo_grupo_cuenta,
    nombre_grupo_cuenta,
    orden_reporte,
    id_cuenta,
    codigo_cuenta,
    nombre_cuenta,
    debe_mes,
    haber_mes,
    saldo_natural_mes AS saldo_resultado_mes,
    saldo_natural_acumulado_anual AS saldo_resultado_acumulado_anual
FROM contabilidad.v_powerbi_eeff_cuenta_mensual
WHERE tipo_reporte = 'RESULTADOS'
  AND seccion_eeff IN ('INGRESO', 'GASTO');

COMMENT ON VIEW contabilidad.v_powerbi_estado_resultados_mensual IS
'Estado de Resultados mensual para Power BI. Usa saldo del mes y acumulado anual para ingresos y gastos.';

-- =========================================================
-- 9) RESUMEN FINANCIERO MENSUAL
--    KPIs para tarjetas de Power BI.
-- =========================================================

CREATE VIEW contabilidad.v_powerbi_resumen_financiero_mensual AS
WITH periodos AS (
    SELECT DISTINCT periodo_inicio, periodo_fin, anio, mes
    FROM contabilidad.v_powerbi_eeff_cuenta_mensual
),
balance AS (
    SELECT
        periodo_inicio,
        SUM(CASE WHEN seccion_balance = 'ACTIVO' THEN saldo_balance ELSE 0 END)::numeric(18,2) AS total_activo,
        SUM(CASE WHEN seccion_balance = 'PASIVO' THEN saldo_balance ELSE 0 END)::numeric(18,2) AS total_pasivo,
        SUM(CASE WHEN seccion_balance = 'PATRIMONIO' THEN saldo_balance ELSE 0 END)::numeric(18,2) AS total_patrimonio
    FROM contabilidad.v_powerbi_balance_general_mensual
    GROUP BY periodo_inicio
),
resultados AS (
    SELECT
        periodo_inicio,
        SUM(CASE WHEN seccion_resultado = 'INGRESO' THEN saldo_resultado_mes ELSE 0 END)::numeric(18,2) AS total_ingresos_mes,
        SUM(CASE WHEN seccion_resultado = 'GASTO' THEN saldo_resultado_mes ELSE 0 END)::numeric(18,2) AS total_gastos_mes,
        SUM(CASE WHEN seccion_resultado = 'INGRESO' THEN saldo_resultado_acumulado_anual ELSE 0 END)::numeric(18,2) AS total_ingresos_acumulado_anual,
        SUM(CASE WHEN seccion_resultado = 'GASTO' THEN saldo_resultado_acumulado_anual ELSE 0 END)::numeric(18,2) AS total_gastos_acumulado_anual
    FROM contabilidad.v_powerbi_estado_resultados_mensual
    GROUP BY periodo_inicio
)
SELECT
    p.periodo_inicio,
    p.periodo_fin,
    p.anio,
    p.mes,

    COALESCE(b.total_activo, 0)::numeric(18,2) AS total_activo,
    COALESCE(b.total_pasivo, 0)::numeric(18,2) AS total_pasivo,
    COALESCE(b.total_patrimonio, 0)::numeric(18,2) AS total_patrimonio,

    COALESCE(r.total_ingresos_mes, 0)::numeric(18,2) AS total_ingresos_mes,
    COALESCE(r.total_gastos_mes, 0)::numeric(18,2) AS total_gastos_mes,
    (COALESCE(r.total_ingresos_mes, 0) - COALESCE(r.total_gastos_mes, 0))::numeric(18,2) AS utilidad_neta_mes,

    COALESCE(r.total_ingresos_acumulado_anual, 0)::numeric(18,2) AS total_ingresos_acumulado_anual,
    COALESCE(r.total_gastos_acumulado_anual, 0)::numeric(18,2) AS total_gastos_acumulado_anual,
    (COALESCE(r.total_ingresos_acumulado_anual, 0) - COALESCE(r.total_gastos_acumulado_anual, 0))::numeric(18,2) AS utilidad_neta_acumulada_anual,

    (
        COALESCE(b.total_activo, 0)
        - (
            COALESCE(b.total_pasivo, 0)
            + COALESCE(b.total_patrimonio, 0)
            + (COALESCE(r.total_ingresos_acumulado_anual, 0) - COALESCE(r.total_gastos_acumulado_anual, 0))
        )
    )::numeric(18,2) AS diferencia_ecuacion_contable,

    CASE
        WHEN ABS(
            COALESCE(b.total_activo, 0)
            - (
                COALESCE(b.total_pasivo, 0)
                + COALESCE(b.total_patrimonio, 0)
                + (COALESCE(r.total_ingresos_acumulado_anual, 0) - COALESCE(r.total_gastos_acumulado_anual, 0))
            )
        ) < 0.005 THEN 'CUADRADO'
        ELSE 'REVISAR'
    END AS estado_ecuacion_contable
FROM periodos p
LEFT JOIN balance b
    ON b.periodo_inicio = p.periodo_inicio
LEFT JOIN resultados r
    ON r.periodo_inicio = p.periodo_inicio;

COMMENT ON VIEW contabilidad.v_powerbi_resumen_financiero_mensual IS
'Resumen mensual para tarjetas KPI en Power BI: activo, pasivo, patrimonio, ingresos, gastos, utilidad y validación de ecuación contable.';

COMMIT;

-- =========================================================
-- CONSULTAS DE PRUEBA
-- =========================================================

-- SELECT * FROM contabilidad.v_powerbi_contable_movimiento LIMIT 50;
-- SELECT * FROM contabilidad.v_powerbi_libro_diario ORDER BY fecha_transaccion, id_transaccion, id_movimiento LIMIT 50;
-- SELECT * FROM contabilidad.v_powerbi_libro_diario_resumen ORDER BY fecha_transaccion DESC LIMIT 50;
-- SELECT * FROM contabilidad.v_powerbi_libro_mayor WHERE codigo_cuenta = 'TU_CODIGO_CUENTA' ORDER BY fecha_transaccion, id_transaccion, id_movimiento;
-- SELECT * FROM contabilidad.v_powerbi_balance_general_mensual ORDER BY periodo_inicio, orden_reporte, codigo_cuenta;
-- SELECT * FROM contabilidad.v_powerbi_estado_resultados_mensual ORDER BY periodo_inicio, orden_reporte, codigo_cuenta;
-- SELECT * FROM contabilidad.v_powerbi_resumen_financiero_mensual ORDER BY periodo_inicio;

-- =========================================================
-- ÍNDICES RECOMENDADOS EN TABLAS BASE
-- Ejecutar aparte si notas lentitud en Power BI.
-- =========================================================

-- CREATE INDEX IF NOT EXISTS idx_transaccion_fecha_estado
--     ON contabilidad.transaccion (fecha_transaccion, estado_registro);

-- CREATE INDEX IF NOT EXISTS idx_movimiento_transaccion
--     ON contabilidad.transaccion_movimiento_cuenta (id_transaccion);

-- CREATE INDEX IF NOT EXISTS idx_movimiento_cuenta
--     ON contabilidad.transaccion_movimiento_cuenta (id_cuenta);

-- CREATE INDEX IF NOT EXISTS idx_cuenta_grupo
--     ON contabilidad.cuenta (id_grupo_cuenta);
