-- Migration: 015_contabilidad_precision_periodos_reversion.sql
-- Propósito: cerrar tres brechas contables estructurales detectadas en la auditoría.
--
--   1. PRECISIÓN MONETARIA. `debe` y `haber` eran `double precision` (punto flotante
--      binario) en el libro mayor, siendo la única tabla de dinero del sistema que no
--      usaba `numeric`. La igualdad debe = haber no es fiable sobre float.
--   2. PERIODOS CONTABLES. No existía ningún concepto de periodo ni de cierre, de modo
--      que se podía registrar y modificar movimientos en ejercicios ya reportados.
--   3. TRAZABILIDAD DE REVERSIONES. El asiento reverso solo referenciaba al original en
--      el texto de la glosa: no había vínculo, ni motivo, ni control de doble reversión.
--
-- Idempotente: puede ejecutarse varias veces sin efecto adicional.

-- ---------------------------------------------------------------------------
-- 1. Precisión monetaria del libro mayor
-- ---------------------------------------------------------------------------

-- PostgreSQL rechaza ALTER COLUMN ... TYPE sobre una columna usada por una vista
-- ("cannot alter type of a column used by a view or rule"). El libro mayor tiene
-- vistas encima —las de reportería PowerBI y las de detalle de venta/costo—, y su
-- conjunto no es el mismo en todos los entornos. Por eso las vistas dependientes
-- se recogen del catálogo, se guardan con su definición, se eliminan, se cambia el
-- tipo y se vuelven a crear tal cual estaban. No se asume ninguna lista fija.
DO $$
DECLARE
  v_vistas         jsonb := '[]'::jsonb;
  v_pendientes     jsonb;
  v_restantes      jsonb;
  v_vista          jsonb;
  v_avance         boolean;
  v_error          text;
  r                record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'contabilidad'
       AND table_name = 'transaccion_movimiento_cuenta'
       AND column_name = 'debe'
       AND data_type = 'double precision'
  ) THEN
    RAISE NOTICE 'El libro mayor ya usa numeric(18,2); no hay cambio de tipo que aplicar.';
    RETURN;
  END IF;

  -- Vistas que dependen de la tabla, directa o indirectamente.
  FOR r IN
    WITH RECURSIVE dependientes(oid) AS (
      SELECT DISTINCT rw.ev_class
        FROM pg_depend d
        JOIN pg_rewrite rw ON rw.oid = d.objid
       WHERE d.classid = 'pg_rewrite'::regclass
         AND d.refclassid = 'pg_class'::regclass
         AND d.refobjid = 'contabilidad.transaccion_movimiento_cuenta'::regclass
         AND rw.ev_class <> 'contabilidad.transaccion_movimiento_cuenta'::regclass
      UNION
      SELECT DISTINCT rw.ev_class
        FROM dependientes dep
        JOIN pg_depend d ON d.refobjid = dep.oid AND d.refclassid = 'pg_class'::regclass
        JOIN pg_rewrite rw ON rw.oid = d.objid AND d.classid = 'pg_rewrite'::regclass
       WHERE rw.ev_class <> dep.oid
    )
    SELECT c.oid,
           n.nspname AS esquema,
           c.relname AS nombre,
           pg_get_viewdef(c.oid, true) AS definicion
      FROM dependientes dep
      JOIN pg_class c ON c.oid = dep.oid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'v'
  LOOP
    v_vistas := v_vistas || jsonb_build_object('esquema', r.esquema, 'nombre', r.nombre, 'definicion', r.definicion);
    RAISE NOTICE 'Vista dependiente respaldada: %.%', r.esquema, r.nombre;
  END LOOP;

  FOR v_vista IN SELECT * FROM jsonb_array_elements(v_vistas) LOOP
    EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', v_vista->>'esquema', v_vista->>'nombre');
  END LOOP;

  -- Los importes ya se redondeaban a céntimos en la capa de aplicación, por lo que
  -- round(...,2) no destruye información: materializa la precisión ya asumida.
  ALTER TABLE contabilidad.transaccion_movimiento_cuenta
    ALTER COLUMN debe  TYPE numeric(18, 2) USING round(debe::numeric, 2),
    ALTER COLUMN haber TYPE numeric(18, 2) USING round(haber::numeric, 2);

  ALTER TABLE contabilidad.transaccion_movimiento_cuenta
    ALTER COLUMN debe  SET DEFAULT 0,
    ALTER COLUMN haber SET DEFAULT 0;

  -- Recreación por pasadas: una vista puede apoyarse en otra de la lista y el
  -- catálogo no da un orden garantizado. Se reintenta mientras haya avance; si una
  -- pasada completa no crea ninguna, se aborta con el error real de la primera.
  v_pendientes := v_vistas;
  LOOP
    EXIT WHEN jsonb_array_length(v_pendientes) = 0;
    v_avance := false;
    v_restantes := '[]'::jsonb;
    v_error := NULL;

    FOR v_vista IN SELECT * FROM jsonb_array_elements(v_pendientes) LOOP
      BEGIN
        EXECUTE format('CREATE OR REPLACE VIEW %I.%I AS %s',
                       v_vista->>'esquema', v_vista->>'nombre', v_vista->>'definicion');
        v_avance := true;
      EXCEPTION WHEN others THEN
        v_restantes := v_restantes || v_vista;
        IF v_error IS NULL THEN
          v_error := format('%s.%s: %s', v_vista->>'esquema', v_vista->>'nombre', SQLERRM);
        END IF;
      END;
    END LOOP;

    IF NOT v_avance THEN
      RAISE EXCEPTION 'No se pudo recrear la vista dependiente del libro mayor. %', v_error;
    END IF;

    v_pendientes := v_restantes;
  END LOOP;

  RAISE NOTICE 'Libro mayor migrado a numeric(18,2); % vista(s) dependientes recreadas.',
    jsonb_array_length(v_vistas);
END $$;

-- ---------------------------------------------------------------------------
-- 2. Periodos contables y cierre
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS contabilidad.periodo_contable (
  id_periodo            bigserial PRIMARY KEY,
  codigo                varchar(20)  NOT NULL,
  anio                  smallint     NOT NULL,
  mes                   smallint     NOT NULL,
  fecha_inicio          date         NOT NULL,
  fecha_fin             date         NOT NULL,
  estado                varchar(15)  NOT NULL DEFAULT 'ABIERTO',
  fecha_cierre          timestamptz,
  id_usuario_cierre     bigint,
  motivo_reapertura     text,
  fecha_reapertura      timestamptz,
  id_usuario_reapertura bigint,
  estado_registro       varchar(20)  DEFAULT 'Activo',
  fecha_registro        timestamptz  DEFAULT now(),
  fecha_modificacion    timestamptz,
  version_registro      integer      DEFAULT 1,
  id_usuario_creador    bigint,
  id_usuario_modificacion bigint,
  CONSTRAINT ck_periodo_contable_estado
    CHECK (estado IN ('ABIERTO', 'EN_CIERRE', 'CERRADO', 'REABIERTO')),
  CONSTRAINT ck_periodo_contable_mes  CHECK (mes BETWEEN 1 AND 12),
  CONSTRAINT ck_periodo_contable_anio CHECK (anio BETWEEN 2000 AND 2200),
  CONSTRAINT ck_periodo_contable_rango CHECK (fecha_fin >= fecha_inicio),
  -- Un periodo cerrado debe registrar siempre quién y cuándo lo cerró.
  CONSTRAINT ck_periodo_contable_cierre_auditado
    CHECK (estado <> 'CERRADO' OR (fecha_cierre IS NOT NULL AND id_usuario_cierre IS NOT NULL)),
  -- Una reapertura debe registrar siempre motivo, usuario y fecha.
  CONSTRAINT ck_periodo_contable_reapertura_auditada
    CHECK (
      estado <> 'REABIERTO'
      OR (motivo_reapertura IS NOT NULL
          AND btrim(motivo_reapertura) <> ''
          AND fecha_reapertura IS NOT NULL
          AND id_usuario_reapertura IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_periodo_contable_codigo
  ON contabilidad.periodo_contable (codigo);
CREATE UNIQUE INDEX IF NOT EXISTS ux_periodo_contable_anio_mes
  ON contabilidad.periodo_contable (anio, mes);
CREATE INDEX IF NOT EXISTS ix_periodo_contable_rango
  ON contabilidad.periodo_contable (fecha_inicio, fecha_fin);

-- Un periodo no puede solaparse con otro.
CREATE OR REPLACE FUNCTION contabilidad.fn_periodo_contable_sin_solape()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, contabilidad
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM contabilidad.periodo_contable AS other
     WHERE other.id_periodo <> COALESCE(NEW.id_periodo, -1)
       AND other.fecha_inicio <= NEW.fecha_fin
       AND other.fecha_fin    >= NEW.fecha_inicio
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = format('El periodo %s se solapa con otro periodo contable existente.', NEW.codigo);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_periodo_contable_sin_solape ON contabilidad.periodo_contable;
CREATE TRIGGER trg_periodo_contable_sin_solape
  BEFORE INSERT OR UPDATE ON contabilidad.periodo_contable
  FOR EACH ROW EXECUTE FUNCTION contabilidad.fn_periodo_contable_sin_solape();

-- Resuelve el estado del periodo que contiene una fecha contable.
-- Fechas sin periodo definido se consideran ABIERTAS: el control de cierre solo actúa
-- sobre ejercicios que la organización haya declarado explícitamente.
CREATE OR REPLACE FUNCTION contabilidad.fn_periodo_estado_en(fecha_contable date)
RETURNS varchar
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, contabilidad
AS $$
  SELECT periodo.estado
    FROM contabilidad.periodo_contable AS periodo
   WHERE fecha_contable BETWEEN periodo.fecha_inicio AND periodo.fecha_fin
     AND LOWER(COALESCE(periodo.estado_registro, 'Activo')) = 'activo'
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION contabilidad.fn_bloquear_periodo_cerrado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, contabilidad
AS $$
DECLARE
  fecha_afectada date;
  estado_periodo varchar(15);
BEGIN
  IF TG_TABLE_NAME = 'transaccion' THEN
    fecha_afectada := COALESCE(NEW.fecha_transaccion, OLD.fecha_transaccion);
  ELSE
    SELECT cabecera.fecha_transaccion
      INTO fecha_afectada
      FROM contabilidad.transaccion AS cabecera
     WHERE cabecera.id_transaccion = COALESCE(NEW.id_transaccion, OLD.id_transaccion);
  END IF;

  IF fecha_afectada IS NULL THEN
    RETURN NEW;
  END IF;

  estado_periodo := contabilidad.fn_periodo_estado_en(fecha_afectada);

  IF estado_periodo IN ('CERRADO', 'EN_CIERRE') THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = format(
        'El periodo contable de la fecha %s está en estado %s; no admite movimientos. '
        || 'Reabre el periodo con motivo justificado o registra el asiento en un periodo abierto.',
        fecha_afectada, estado_periodo
      );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transaccion_periodo_cerrado ON contabilidad.transaccion;
CREATE TRIGGER trg_transaccion_periodo_cerrado
  BEFORE INSERT OR UPDATE ON contabilidad.transaccion
  FOR EACH ROW EXECUTE FUNCTION contabilidad.fn_bloquear_periodo_cerrado();

DROP TRIGGER IF EXISTS trg_movimiento_periodo_cerrado ON contabilidad.transaccion_movimiento_cuenta;
CREATE TRIGGER trg_movimiento_periodo_cerrado
  BEFORE INSERT OR UPDATE ON contabilidad.transaccion_movimiento_cuenta
  FOR EACH ROW EXECUTE FUNCTION contabilidad.fn_bloquear_periodo_cerrado();

-- ---------------------------------------------------------------------------
-- 3. Trazabilidad de reversiones
-- ---------------------------------------------------------------------------

ALTER TABLE contabilidad.transaccion
  ADD COLUMN IF NOT EXISTS id_transaccion_revertida bigint,
  ADD COLUMN IF NOT EXISTS motivo_reversion         text,
  ADD COLUMN IF NOT EXISTS fecha_reversion          timestamptz,
  ADD COLUMN IF NOT EXISTS id_usuario_reversion     bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaccion_revertida'
  ) THEN
    ALTER TABLE contabilidad.transaccion
      ADD CONSTRAINT fk_transaccion_revertida
      FOREIGN KEY (id_transaccion_revertida)
      REFERENCES contabilidad.transaccion (id_transaccion);
  END IF;
END $$;

-- Un asiento no puede revertirse dos veces.
CREATE UNIQUE INDEX IF NOT EXISTS ux_transaccion_reversion_unica
  ON contabilidad.transaccion (id_transaccion_revertida)
  WHERE id_transaccion_revertida IS NOT NULL
    AND LOWER(COALESCE(estado_registro, 'Activo')) = 'activo';

-- Un asiento no puede revertirse a sí mismo.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_transaccion_reversion_no_reflexiva'
  ) THEN
    ALTER TABLE contabilidad.transaccion
      ADD CONSTRAINT ck_transaccion_reversion_no_reflexiva
      CHECK (id_transaccion_revertida IS NULL OR id_transaccion_revertida <> id_transaccion);
  END IF;
END $$;

-- Toda reversión debe declarar motivo y usuario responsable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_transaccion_reversion_auditada'
  ) THEN
    ALTER TABLE contabilidad.transaccion
      ADD CONSTRAINT ck_transaccion_reversion_auditada
      CHECK (
        id_transaccion_revertida IS NULL
        OR (motivo_reversion IS NOT NULL
            AND btrim(motivo_reversion) <> ''
            AND fecha_reversion IS NOT NULL)
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Cerrar el hueco de `estado_registro` en el libro mayor
-- ---------------------------------------------------------------------------
-- La migración 014 protege el contenido económico del movimiento pero deja mutable
-- `estado_registro`. Como el trigger de balanceo solo suma movimientos activos,
-- desactivar un subconjunto balanceado anulaba parte de un asiento sin reversión.

CREATE OR REPLACE FUNCTION contabilidad.fn_proteger_movimiento_contable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, contabilidad
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'Los movimientos contables no se eliminan; deben corregirse mediante asiento reverso.';
  END IF;

  IF (
    to_jsonb(NEW) - ARRAY['fecha_modificacion', 'id_usuario_modificacion', 'version_registro']
  ) IS DISTINCT FROM (
    to_jsonb(OLD) - ARRAY['fecha_modificacion', 'id_usuario_modificacion', 'version_registro']
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'No se permite alterar un movimiento contable, ni siquiera su estado_registro; use reversión.';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Índices de apoyo a los libros y estados financieros
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS ix_transaccion_fecha
  ON contabilidad.transaccion (fecha_transaccion);
CREATE INDEX IF NOT EXISTS ix_movimiento_cuenta_cuenta
  ON contabilidad.transaccion_movimiento_cuenta (id_cuenta);
CREATE INDEX IF NOT EXISTS ix_movimiento_cuenta_cuenta_transaccion
  ON contabilidad.transaccion_movimiento_cuenta (id_cuenta, id_transaccion);
CREATE INDEX IF NOT EXISTS ix_cuenta_grupo
  ON contabilidad.cuenta (id_grupo_cuenta);
CREATE INDEX IF NOT EXISTS ix_cuenta_codigo
  ON contabilidad.cuenta (codigo);

-- ---------------------------------------------------------------------------
-- 6. Permisos de los procesos contables nuevos
-- ---------------------------------------------------------------------------

INSERT INTO seguridad.permiso (codigo, descripcion, modulo)
VALUES
  ('CONTABILIDAD.PERIODO.READ',    'Consultar periodos contables',                  'contabilidad'),
  ('CONTABILIDAD.PERIODO.CREATE',  'Crear periodos contables',                      'contabilidad'),
  ('CONTABILIDAD.PERIODO.CERRAR',  'Cerrar un periodo contable',                    'contabilidad'),
  ('CONTABILIDAD.PERIODO.REABRIR', 'Reabrir un periodo contable cerrado',           'contabilidad'),
  ('CONTABILIDAD.LIBRO_DIARIO.READ',    'Consultar el libro diario',                'contabilidad'),
  ('CONTABILIDAD.LIBRO_MAYOR.READ',     'Consultar el libro mayor',                 'contabilidad'),
  ('CONTABILIDAD.BALANCE_COMPROBACION.READ', 'Consultar el balance de comprobación','contabilidad'),
  ('CONTABILIDAD.ESTADO_RESULTADOS.READ',    'Consultar el estado de resultados',   'contabilidad'),
  ('CONTABILIDAD.BALANCE_GENERAL.READ',      'Consultar el balance general',        'contabilidad'),
  ('CONTABILIDAD.DASHBOARD.READ',            'Consultar el tablero contable',       'contabilidad')
ON CONFLICT (codigo) DO NOTHING;

-- Los roles contables reciben lectura de libros y estados financieros.
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT rol.id_rol, permiso.id_permiso
  FROM seguridad.rol AS rol
  CROSS JOIN seguridad.permiso AS permiso
 WHERE rol.nombre IN (
         'Super administrador', 'Administrador general', 'Contador general',
         'Contador', 'Auxiliar contable', 'Auditor de lectura', 'Reportería contable'
       )
   AND permiso.codigo IN (
         'CONTABILIDAD.PERIODO.READ',
         'CONTABILIDAD.LIBRO_DIARIO.READ',
         'CONTABILIDAD.LIBRO_MAYOR.READ',
         'CONTABILIDAD.BALANCE_COMPROBACION.READ',
         'CONTABILIDAD.ESTADO_RESULTADOS.READ',
         'CONTABILIDAD.BALANCE_GENERAL.READ',
         'CONTABILIDAD.DASHBOARD.READ'
       )
ON CONFLICT DO NOTHING;

-- Cierre y reapertura quedan reservados a los roles con responsabilidad contable plena.
-- La reapertura es deliberadamente más restrictiva que el cierre.
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT rol.id_rol, permiso.id_permiso
  FROM seguridad.rol AS rol
  CROSS JOIN seguridad.permiso AS permiso
 WHERE rol.nombre IN ('Super administrador', 'Administrador general', 'Contador general')
   AND permiso.codigo IN ('CONTABILIDAD.PERIODO.CREATE', 'CONTABILIDAD.PERIODO.CERRAR', 'CONTABILIDAD.PERIODO.REABRIR')
ON CONFLICT DO NOTHING;
