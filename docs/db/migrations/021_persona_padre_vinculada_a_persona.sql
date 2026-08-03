-- 021_persona_padre_vinculada_a_persona.sql
--
-- `persona.persona_padre` nació sin vínculo con `persona.persona`: su única llave
-- es un `id_padre` correlativo propio, y sus columnas de negocio son
-- `es_embajador` y `metadata`. Un padre no tenía dónde guardar nombre, apellidos,
-- teléfono ni correo, así que la pantalla de alta sólo podía ofrecer la casilla
-- "Es Embajador" y el registro nacía sin identidad: imposible saber a quién
-- correspondía ni relacionarlo con el estudiante en un trato real.
--
-- El resto de los hijos de persona ya resuelven esto igual: `persona_tutor` tiene
-- `id_persona` con FK a `persona.persona` y borrado en cascada, y
-- `persona_estudiante` usa directamente el id de la persona. Esta migración pone
-- a `persona_padre` en la misma forma.
--
-- Idempotente: se puede ejecutar varias veces sin duplicar ni perder datos.

-- ---------------------------------------------------------------------------
-- 1) La columna y su llave foránea
-- ---------------------------------------------------------------------------

ALTER TABLE persona.persona_padre
  ADD COLUMN IF NOT EXISTS id_persona bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'persona_padre_id_persona_fkey'
      AND conrelid = 'persona.persona_padre'::regclass
  ) THEN
    -- ON DELETE CASCADE, igual que persona_tutor: borrar la persona no debe
    -- dejar un padre huérfano apuntando a nadie.
    ALTER TABLE persona.persona_padre
      ADD CONSTRAINT persona_padre_id_persona_fkey
      FOREIGN KEY (id_persona) REFERENCES persona.persona(id_persona) ON DELETE CASCADE;
  END IF;
END $$;

COMMENT ON COLUMN persona.persona_padre.id_persona IS
  'Persona base del padre o madre. Se crea junto con el registro en POST /api/personas/padre/registrar; el alta fragmentada por el CRUD genérico está bloqueada.';

-- ---------------------------------------------------------------------------
-- 2) Una persona no es padre dos veces
-- ---------------------------------------------------------------------------

-- Índice parcial: si una base heredada tuviera filas antiguas sin persona, no
-- bloquean la creación del índice ni chocan entre sí.
CREATE UNIQUE INDEX IF NOT EXISTS ux_persona_padre_id_persona
  ON persona.persona_padre (id_persona)
  WHERE id_persona IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) Obligatoriedad, sólo si la base está en condiciones
-- ---------------------------------------------------------------------------

-- En una base sin filas huérfanas la columna pasa a NOT NULL y la regla queda
-- garantizada por el esquema. Si quedaran registros heredados sin persona, se
-- deja nullable y se avisa: forzarlo abortaría el despliegue y la aplicación ya
-- exige la persona en el endpoint de alta.
DO $$
DECLARE
  v_huerfanos integer;
BEGIN
  SELECT count(*) INTO v_huerfanos FROM persona.persona_padre WHERE id_persona IS NULL;

  IF v_huerfanos > 0 THEN
    RAISE NOTICE 'persona_padre conserva % fila(s) sin persona; id_persona queda opcional hasta que se completen.', v_huerfanos;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'persona' AND table_name = 'persona_padre'
      AND column_name = 'id_persona' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE persona.persona_padre ALTER COLUMN id_persona SET NOT NULL;
  END IF;
END $$;
