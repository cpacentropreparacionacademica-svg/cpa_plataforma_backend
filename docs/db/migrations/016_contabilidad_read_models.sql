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
-- 0. Reemplazo seguro de vistas preexistentes
-- ---------------------------------------------------------------------------
--
-- `CREATE OR REPLACE VIEW` no puede renombrar ni reordenar columnas
-- ("cannot change name of view column ..."). En bases donde alguien aplicó
-- `docs/db/ddl.views.sql` a mano, `v_powerbi_contable_movimiento` ya existe con
-- otra lista de columnas y esta migración fallaba entera.
--
-- Un DROP ... CASCADE a secas tampoco sirve: los tableros Power BI
-- (libro diario, libro mayor, balance, estado de resultados) se apoyan en esas
-- vistas y desaparecerían en silencio. Por eso se respaldan las definiciones de
-- todo lo que dependa de ellas, se eliminan, se crean las versiones nuevas y se
-- restaura lo respaldado.

CREATE TEMP TABLE tmp_vistas_dependientes (
  esquema    text NOT NULL,
  nombre     text NOT NULL,
  definicion text NOT NULL
) ON COMMIT DROP;

DO $$
DECLARE
  -- Vistas que esta migración recrea. Sus dependientes se respaldan; ellas no,
  -- porque su definición nueva es justamente la que se va a aplicar.
  v_propias text[] := ARRAY[
    'v_movimiento_contable',
    'v_powerbi_contable_movimiento',
    'v_plan_cuentas',
    'v_asiento_integridad'
  ];
  v_objetivo text;
  r          record;
BEGIN
  FOREACH v_objetivo IN ARRAY v_propias LOOP
    CONTINUE WHEN to_regclass('contabilidad.' || quote_ident(v_objetivo)) IS NULL;

    FOR r IN
      WITH RECURSIVE dependientes(oid) AS (
        SELECT DISTINCT rw.ev_class
          FROM pg_depend d
          JOIN pg_rewrite rw ON rw.oid = d.objid
         WHERE d.classid = 'pg_rewrite'::regclass
           AND d.refclassid = 'pg_class'::regclass
           AND d.refobjid = to_regclass('contabilidad.' || quote_ident(v_objetivo))
           AND rw.ev_class <> to_regclass('contabilidad.' || quote_ident(v_objetivo))
        UNION
        SELECT DISTINCT rw.ev_class
          FROM dependientes dep
          JOIN pg_depend d ON d.refobjid = dep.oid AND d.refclassid = 'pg_class'::regclass
          JOIN pg_rewrite rw ON rw.oid = d.objid AND d.classid = 'pg_rewrite'::regclass
         WHERE rw.ev_class <> dep.oid
      )
      SELECT n.nspname AS esquema, c.relname AS nombre, pg_get_viewdef(c.oid, true) AS definicion
        FROM dependientes dep
        JOIN pg_class c ON c.oid = dep.oid
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE c.relkind = 'v'
         AND NOT (n.nspname = 'contabilidad' AND c.relname = ANY(v_propias))
    LOOP
      INSERT INTO tmp_vistas_dependientes (esquema, nombre, definicion)
      SELECT r.esquema, r.nombre, r.definicion
      WHERE NOT EXISTS (
        SELECT 1 FROM tmp_vistas_dependientes t
         WHERE t.esquema = r.esquema AND t.nombre = r.nombre
      );
      RAISE NOTICE 'Vista dependiente respaldada: %.%', r.esquema, r.nombre;
    END LOOP;
  END LOOP;

  FOREACH v_objetivo IN ARRAY v_propias LOOP
    EXECUTE format('DROP VIEW IF EXISTS contabilidad.%I CASCADE', v_objetivo);
  END LOOP;
END $$;

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

-- ---------------------------------------------------------------------------
-- 4. Restauración de las vistas dependientes respaldadas en el paso 0
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_avance  boolean;
  v_error   text;
  v_faltan  integer;
  r         record;
BEGIN
  SELECT count(*) INTO v_faltan FROM tmp_vistas_dependientes;
  IF v_faltan = 0 THEN
    RAISE NOTICE 'No había vistas dependientes que restaurar.';
    RETURN;
  END IF;

  -- Recreación por pasadas: una vista respaldada puede apoyarse en otra y el
  -- catálogo no garantiza un orden. Se reintenta mientras haya avance.
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM tmp_vistas_dependientes);
    v_avance := false;
    v_error := NULL;

    FOR r IN SELECT * FROM tmp_vistas_dependientes LOOP
      BEGIN
        EXECUTE format('CREATE OR REPLACE VIEW %I.%I AS %s', r.esquema, r.nombre, r.definicion);
        DELETE FROM tmp_vistas_dependientes t WHERE t.esquema = r.esquema AND t.nombre = r.nombre;
        v_avance := true;
      EXCEPTION WHEN others THEN
        IF v_error IS NULL THEN v_error := format('%s.%s: %s', r.esquema, r.nombre, SQLERRM); END IF;
      END;
    END LOOP;

    IF NOT v_avance THEN
      RAISE EXCEPTION 'No se pudo restaurar una vista dependiente de la capa de lectura contable. %', v_error;
    END IF;
  END LOOP;

  RAISE NOTICE '% vista(s) dependiente(s) restauradas.', v_faltan;
END $$;
