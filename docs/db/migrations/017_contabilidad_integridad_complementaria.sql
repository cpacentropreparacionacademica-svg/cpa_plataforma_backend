-- Migration: 017_contabilidad_integridad_complementaria.sql
-- Propósito: cerrar los controles contables que quedaban abiertos tras la auditoría.
--
--   1. PLAN DE CUENTAS. Reclasificar o desactivar una cuenta que ya tiene movimientos
--      reexpresa los estados financieros de ejercicios anteriores sin tocar el libro.
--   2. ASIGNACIÓN DE CUENTAS. `ensureCuentaAsignacion` comprueba y luego inserta, sin
--      índice único detrás: dos altas simultáneas del mismo estudiante duplicaban la
--      asignación y volvían ambiguo el resultado de `resolveCuentaEstudianteId`.
--   3. PAGO A TUTORES. `estado_pago` era libremente modificable por el CRUD genérico y
--      `total` no guardaba relación con `subtotal + ajustes`.
--
-- Idempotente.

-- ---------------------------------------------------------------------------
-- 1. Protección del plan de cuentas con movimientos
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION contabilidad.fn_proteger_cuenta_con_movimientos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, contabilidad
AS $$
DECLARE
  tiene_movimientos boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM contabilidad.transaccion_movimiento_cuenta m WHERE m.id_cuenta = OLD.id_cuenta) THEN
      RAISE EXCEPTION USING
        ERRCODE = '55000',
        MESSAGE = format('La cuenta %s tiene movimientos contables y no puede eliminarse.', OLD.codigo);
    END IF;
    RETURN OLD;
  END IF;

  -- Solo interesa el caso en que cambia la identidad o la clasificación contable.
  IF NEW.codigo IS NOT DISTINCT FROM OLD.codigo
     AND NEW.id_grupo_cuenta IS NOT DISTINCT FROM OLD.id_grupo_cuenta
     AND LOWER(COALESCE(NEW.estado_registro, 'Activo')) = LOWER(COALESCE(OLD.estado_registro, 'Activo')) THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM contabilidad.transaccion_movimiento_cuenta m
     WHERE m.id_cuenta = OLD.id_cuenta
       AND LOWER(COALESCE(m.estado_registro, 'Activo')) = 'activo'
  ) INTO tiene_movimientos;

  IF NOT tiene_movimientos THEN
    RETURN NEW;
  END IF;

  IF NEW.id_grupo_cuenta IS DISTINCT FROM OLD.id_grupo_cuenta THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = format(
        'La cuenta %s tiene movimientos contabilizados: cambiar su grupo reexpresaría estados financieros ya emitidos. '
        || 'Crea una cuenta nueva y reclasifica mediante asientos.', OLD.codigo);
  END IF;

  IF NEW.codigo IS DISTINCT FROM OLD.codigo THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = format('La cuenta %s tiene movimientos contabilizados y su código no puede cambiarse.', OLD.codigo);
  END IF;

  IF LOWER(COALESCE(NEW.estado_registro, 'Activo')) <> 'activo' THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = format(
        'La cuenta %s tiene movimientos contabilizados y no puede desactivarse: desaparecería de los libros.', OLD.codigo);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_cuenta_con_movimientos ON contabilidad.cuenta;
CREATE TRIGGER trg_proteger_cuenta_con_movimientos
  BEFORE UPDATE OR DELETE ON contabilidad.cuenta
  FOR EACH ROW EXECUTE FUNCTION contabilidad.fn_proteger_cuenta_con_movimientos();

-- ---------------------------------------------------------------------------
-- 2. Unicidad de la asignación de cuentas por entidad
-- ---------------------------------------------------------------------------

-- Se eliminan duplicados preexistentes conservando la asignación de menor prioridad
-- (la que `resolveCuentaEstudianteId` habría elegido), para poder crear el índice único.
WITH duplicadas AS (
  SELECT id_cuenta_asignacion,
         ROW_NUMBER() OVER (
           PARTITION BY entidad_tipo,
                        COALESCE(id_persona_estudiante, -1),
                        COALESCE(id_persona_tutor, -1),
                        id_cuenta
           ORDER BY prioridad ASC, id_cuenta_asignacion ASC
         ) AS posicion
    FROM contabilidad.cuenta_asignacion
   WHERE LOWER(COALESCE(estado_registro, 'Activo')) = 'activo'
)
UPDATE contabilidad.cuenta_asignacion AS asignacion
   SET estado_registro = 'Inactivo',
       fecha_modificacion = now()
  FROM duplicadas
 WHERE duplicadas.id_cuenta_asignacion = asignacion.id_cuenta_asignacion
   AND duplicadas.posicion > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ux_cuenta_asignacion_entidad_cuenta
  ON contabilidad.cuenta_asignacion (
    entidad_tipo,
    COALESCE(id_persona_estudiante, -1),
    COALESCE(id_persona_tutor, -1),
    id_cuenta
  )
  WHERE LOWER(COALESCE(estado_registro, 'Activo')) = 'activo';

-- `entidad_tipo` era texto libre; los valores los fijaba únicamente el código.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_cuenta_asignacion_entidad_tipo') THEN
    ALTER TABLE contabilidad.cuenta_asignacion
      ADD CONSTRAINT ck_cuenta_asignacion_entidad_tipo
      CHECK (entidad_tipo IN (
        'ESTUDIANTE_CXC', 'ESTUDIANTE_PAQUETE_DIFERIDO', 'TUTOR_CXP',
        'EMPLEADO_CXP', 'PROVEEDOR_CXP', 'SUCURSAL', 'TIENDA', 'BIEN', 'DEUDA', 'DEPARTAMENTO'
      ))
      NOT VALID;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Integridad del pago a tutores
-- ---------------------------------------------------------------------------

-- NOT VALID: no se rechazan filas históricas que ya incumplieran la relación; sí se
-- exige a partir de ahora. Validar en caliente podría bloquear el despliegue.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_pago_tutor_total_coherente') THEN
    ALTER TABLE contabilidad.pago_tutor
      ADD CONSTRAINT ck_pago_tutor_total_coherente
      CHECK (round(total, 2) = round(subtotal + ajustes, 2))
      NOT VALID;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION contabilidad.fn_pago_tutor_transicion_estado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, contabilidad
AS $$
BEGIN
  IF NEW.estado_pago IS NOT DISTINCT FROM OLD.estado_pago THEN
    -- Un pago ya pagado o anulado no admite cambios de importe.
    IF OLD.estado_pago IN ('PAGADO', 'ANULADO')
       AND (NEW.subtotal IS DISTINCT FROM OLD.subtotal
            OR NEW.ajustes IS DISTINCT FROM OLD.ajustes
            OR NEW.total   IS DISTINCT FROM OLD.total) THEN
      RAISE EXCEPTION USING
        ERRCODE = '55000',
        MESSAGE = format('El pago a tutor %s está %s: sus importes no pueden modificarse.', OLD.id_pago_tutor, OLD.estado_pago);
    END IF;
    RETURN NEW;
  END IF;

  -- Transiciones admitidas: BORRADOR -> APROBADO -> PAGADO, y ANULADO desde cualquier
  -- estado que no sea PAGADO. Antes se podía saltar de BORRADOR a PAGADO sin aprobación.
  IF NOT (
       (OLD.estado_pago = 'BORRADOR' AND NEW.estado_pago IN ('APROBADO', 'ANULADO'))
    OR (OLD.estado_pago = 'APROBADO' AND NEW.estado_pago IN ('PAGADO', 'ANULADO'))
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = format(
        'Transición de estado no permitida en pago a tutor: %s -> %s. '
        || 'El flujo válido es BORRADOR -> APROBADO -> PAGADO, con ANULADO disponible antes del pago.',
        OLD.estado_pago, NEW.estado_pago);
  END IF;

  IF NEW.estado_pago = 'APROBADO' AND NEW.fecha_aprobacion IS NULL THEN
    NEW.fecha_aprobacion := now();
  END IF;

  IF NEW.estado_pago = 'PAGADO' AND NEW.fecha_pago IS NULL THEN
    NEW.fecha_pago := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pago_tutor_transicion_estado ON contabilidad.pago_tutor;
CREATE TRIGGER trg_pago_tutor_transicion_estado
  BEFORE UPDATE ON contabilidad.pago_tutor
  FOR EACH ROW EXECUTE FUNCTION contabilidad.fn_pago_tutor_transicion_estado();

-- ---------------------------------------------------------------------------
-- 4. Una tarifa histórica no debe alterar liquidaciones ya pagadas
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION contabilidad.fn_proteger_detalle_pago_tutor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, contabilidad
AS $$
DECLARE
  estado_actual text;
BEGIN
  SELECT pago.estado_pago
    INTO estado_actual
    FROM contabilidad.pago_tutor AS pago
   WHERE pago.id_pago_tutor = COALESCE(NEW.id_pago_tutor, OLD.id_pago_tutor);

  IF estado_actual IN ('PAGADO', 'ANULADO') THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = format(
        'El detalle pertenece a una liquidación en estado %s y no puede modificarse. '
        || 'La tarifa aplicada queda congelada al liquidar.', estado_actual);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_detalle_pago_tutor ON contabilidad.pago_tutor_detalle;
CREATE TRIGGER trg_proteger_detalle_pago_tutor
  BEFORE UPDATE OR DELETE ON contabilidad.pago_tutor_detalle
  FOR EACH ROW EXECUTE FUNCTION contabilidad.fn_proteger_detalle_pago_tutor();
