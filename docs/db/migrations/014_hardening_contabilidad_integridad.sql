-- CPA accounting integrity hardening.
--
-- This migration adds database-level invariants so journal integrity does not
-- depend exclusively on one HTTP service implementation. It intentionally does
-- not claim IFRS, XBRL, COSO or ISO certification; those require organisational
-- policy, evidence and professional review in addition to technical controls.

ALTER TABLE contabilidad.transaccion_movimiento_cuenta
  ADD CONSTRAINT ck_transaccion_movimiento_debe_haber_no_negativo
  CHECK (COALESCE(debe, 0) >= 0 AND COALESCE(haber, 0) >= 0)
  NOT VALID;

ALTER TABLE contabilidad.transaccion_movimiento_cuenta
  ADD CONSTRAINT ck_transaccion_movimiento_un_solo_lado
  CHECK (
    (CASE WHEN COALESCE(debe, 0) > 0 THEN 1 ELSE 0 END)
    + (CASE WHEN COALESCE(haber, 0) > 0 THEN 1 ELSE 0 END)
    = 1
  )
  NOT VALID;

ALTER TABLE contabilidad.transaccion_movimiento_cuenta
  VALIDATE CONSTRAINT ck_transaccion_movimiento_debe_haber_no_negativo;

ALTER TABLE contabilidad.transaccion_movimiento_cuenta
  VALIDATE CONSTRAINT ck_transaccion_movimiento_un_solo_lado;

CREATE OR REPLACE FUNCTION contabilidad.fn_validar_asiento_balanceado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, contabilidad
AS $$
DECLARE
  transaction_id bigint := COALESCE(NEW.id_transaccion, OLD.id_transaccion);
  debit_total numeric(30, 6);
  credit_total numeric(30, 6);
BEGIN
  SELECT
    COALESCE(SUM(COALESCE(movement.debe, 0)), 0),
    COALESCE(SUM(COALESCE(movement.haber, 0)), 0)
  INTO debit_total, credit_total
  FROM contabilidad.transaccion_movimiento_cuenta AS movement
  WHERE movement.id_transaccion = transaction_id
    AND LOWER(COALESCE(movement.estado_registro, 'Activo')) = 'activo';

  IF debit_total <= 0 OR credit_total <= 0 OR debit_total <> credit_total THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = format(
        'El asiento %s no está balanceado o carece de movimientos activos: debe=%s haber=%s',
        transaction_id,
        debit_total,
        credit_total
      );
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_asiento_balanceado
  ON contabilidad.transaccion_movimiento_cuenta;

CREATE CONSTRAINT TRIGGER trg_validar_asiento_balanceado
AFTER INSERT OR UPDATE OR DELETE
ON contabilidad.transaccion_movimiento_cuenta
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION contabilidad.fn_validar_asiento_balanceado();

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
    to_jsonb(NEW) - ARRAY['estado_registro', 'fecha_modificacion', 'id_usuario_modificacion', 'version_registro']
  ) IS DISTINCT FROM (
    to_jsonb(OLD) - ARRAY['estado_registro', 'fecha_modificacion', 'id_usuario_modificacion', 'version_registro']
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'No se permite alterar el contenido económico de un movimiento contable; use reversión.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_movimiento_contable
  ON contabilidad.transaccion_movimiento_cuenta;

CREATE TRIGGER trg_proteger_movimiento_contable
BEFORE UPDATE OR DELETE
ON contabilidad.transaccion_movimiento_cuenta
FOR EACH ROW
EXECUTE FUNCTION contabilidad.fn_proteger_movimiento_contable();

CREATE OR REPLACE FUNCTION contabilidad.fn_proteger_cabecera_asiento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, contabilidad
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'Los asientos contables no se eliminan; deben corregirse mediante asiento reverso.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM contabilidad.transaccion_movimiento_cuenta AS movement
    WHERE movement.id_transaccion = OLD.id_transaccion
  ) AND (
    to_jsonb(NEW) - ARRAY['estado_registro', 'fecha_modificacion', 'id_usuario_modificacion', 'version_registro']
  ) IS DISTINCT FROM (
    to_jsonb(OLD) - ARRAY['estado_registro', 'fecha_modificacion', 'id_usuario_modificacion', 'version_registro']
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'No se permite alterar un asiento contabilizado; use reversión.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_cabecera_asiento
  ON contabilidad.transaccion;

CREATE TRIGGER trg_proteger_cabecera_asiento
BEFORE UPDATE OR DELETE
ON contabilidad.transaccion
FOR EACH ROW
EXECUTE FUNCTION contabilidad.fn_proteger_cabecera_asiento();

CREATE INDEX IF NOT EXISTS idx_movimiento_contable_transaccion_activo
  ON contabilidad.transaccion_movimiento_cuenta (id_transaccion)
  WHERE LOWER(COALESCE(estado_registro, 'Activo')) = 'activo';
