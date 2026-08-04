-- 024_fix_trigger_clase_pagada_columna_estado.sql
--
-- Arregla servicios_educativos.trg_bloquear_edicion_clase_pagada(), que
-- consultaba `p.estado` sobre contabilidad.pago_tutor. Esa columna no existe:
-- se llama `estado_pago`, y así lo declara su propio CHECK
--   ck_pago_tutor_estado CHECK (estado_pago IN ('BORRADOR','APROBADO','PAGADO','ANULADO'))
--
-- Consecuencia en producción: el trigger está declarado BEFORE DELETE OR UPDATE
-- sobre servicios_educativos.clase_por_hora, de modo que la función se evalúa en
-- CADA borrado y CADA edición de una clase por hora. Al referirse a una columna
-- inexistente, plpgsql aborta con
--   column p.estado does not exist
-- y la operación entera falla. O sea: hoy no se puede editar ni eliminar ninguna
-- clase por hora, esté pagada o no, y la protección que el trigger dice aplicar
-- —bloquear solo las clases incluidas en una planilla APROBADA o PAGADA— nunca
-- llegó a funcionar.
--
-- El cuerpo se mantiene igual salvo el nombre de la columna, para restituir
-- exactamente el comportamiento que la función declaraba tener.
--
-- Idempotente: CREATE OR REPLACE, se puede ejecutar varias veces.

CREATE OR REPLACE FUNCTION servicios_educativos.trg_bloquear_edicion_clase_pagada() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_bloqueada boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM contabilidad.pago_tutor_detalle d
    JOIN contabilidad.pago_tutor p
      ON p.id_pago_tutor = d.id_pago_tutor
    WHERE d.id_clase = OLD.id_clase
      AND p.estado_pago IN ('APROBADO','PAGADO')
  ) INTO v_bloqueada;

  IF v_bloqueada THEN
    RAISE EXCEPTION 'No se puede modificar/eliminar una clase incluida en una planilla APROBADA o PAGADA.';
  END IF;

  -- El trigger es BEFORE DELETE OR UPDATE. En un DELETE, NEW es NULL y devolver
  -- NULL cancelaría el borrado en silencio, así que se devuelve OLD.
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
