-- 020_codigo_estudiante_autogenerado.sql
--
-- `persona.persona_estudiante.codigo_estudiante` deja de ser un campo que se
-- llena a mano. Antes era un varchar libre y opcional: los registros nacían con
-- NULL o con códigos improvisados ("COD-001"), sin unicidad ni forma común.
--
-- A partir de aquí lo genera la base de datos con un formato que se reconoce a
-- simple vista como automático:
--
--     EST-<AÑO>-<CORRELATIVO DE 5 DÍGITOS>      ej. EST-2026-00007
--
-- Reglas garantizadas por la base, no por la aplicación (ningún cliente, ni el
-- CRUD genérico ni una carga masiva, puede saltárselas):
--   * INSERT: el valor enviado por el cliente se descarta y se reemplaza por el
--     correlativo. Se acepta el payload sin romperlo, pero no manda.
--   * UPDATE: el código es inmutable, siempre conserva el valor original.
--   * El correlativo es único (índice único) y no se recicla (secuencia).
--
-- Los códigos previos se normalizan al formato nuevo para que la columna sea
-- homogénea. `codigo_estudiante` no es llave foránea de ninguna tabla, así que
-- reescribirlo no arrastra referencias.
--
-- Idempotente: se puede ejecutar varias veces sin duplicar ni perder datos.

-- ---------------------------------------------------------------------------
-- 1) Espacio suficiente para el formato EST-AAAA-NNNNN (14 caracteres)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_longitud integer;
BEGIN
  SELECT character_maximum_length
    INTO v_longitud
  FROM information_schema.columns
  WHERE table_schema = 'persona'
    AND table_name = 'persona_estudiante'
    AND column_name = 'codigo_estudiante';

  IF v_longitud IS NOT NULL AND v_longitud < 30 THEN
    ALTER TABLE persona.persona_estudiante
      ALTER COLUMN codigo_estudiante TYPE varchar(30);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Secuencia y función generadora
-- ---------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS persona.persona_estudiante_codigo_seq
  AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 NO MAXVALUE CACHE 1;

CREATE OR REPLACE FUNCTION persona.generar_codigo_estudiante()
RETURNS varchar
LANGUAGE sql
VOLATILE
AS $$
  SELECT 'EST-'
      || to_char(now(), 'YYYY')
      || '-'
      || lpad(nextval('persona.persona_estudiante_codigo_seq')::text, 5, '0');
$$;

COMMENT ON FUNCTION persona.generar_codigo_estudiante() IS
  'Correlativo institucional del estudiante con formato EST-AAAA-NNNNN. Lo asigna el trigger de persona_estudiante; nunca se envía desde el cliente.';

-- ---------------------------------------------------------------------------
-- 3) Trigger: asigna en INSERT, congela en UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION persona.tg_persona_estudiante_codigo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- El valor que llegue del cliente se ignora a propósito: el código es un
    -- dato del sistema, no de captura.
    NEW.codigo_estudiante := persona.generar_codigo_estudiante();
    RETURN NEW;
  END IF;

  NEW.codigo_estudiante := OLD.codigo_estudiante;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_persona_estudiante_codigo ON persona.persona_estudiante;
CREATE TRIGGER trg_persona_estudiante_codigo
  BEFORE INSERT OR UPDATE ON persona.persona_estudiante
  FOR EACH ROW
  EXECUTE FUNCTION persona.tg_persona_estudiante_codigo();

-- ---------------------------------------------------------------------------
-- 4) Normalización de los códigos existentes
-- ---------------------------------------------------------------------------

-- El trigger congela el código en UPDATE, así que la normalización se hace con
-- el trigger deshabilitado en esta sesión y en orden de antigüedad, para que el
-- correlativo respete el orden real de alta de los estudiantes.
DO $$
DECLARE
  r record;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM persona.persona_estudiante
    WHERE codigo_estudiante IS NULL
       OR codigo_estudiante !~ '^EST-[0-9]{4}-[0-9]{5}$'
  ) THEN
    RAISE NOTICE 'Todos los códigos de estudiante ya usan el formato EST-AAAA-NNNNN.';
    RETURN;
  END IF;

  ALTER TABLE persona.persona_estudiante DISABLE TRIGGER trg_persona_estudiante_codigo;

  FOR r IN
    SELECT id_persona
    FROM persona.persona_estudiante
    WHERE codigo_estudiante IS NULL
       OR codigo_estudiante !~ '^EST-[0-9]{4}-[0-9]{5}$'
    ORDER BY fecha_registro NULLS FIRST, id_persona
  LOOP
    UPDATE persona.persona_estudiante
       SET codigo_estudiante = persona.generar_codigo_estudiante()
     WHERE id_persona = r.id_persona;
  END LOOP;

  ALTER TABLE persona.persona_estudiante ENABLE TRIGGER trg_persona_estudiante_codigo;
END $$;

-- ---------------------------------------------------------------------------
-- 5) Unicidad
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS ux_persona_estudiante_codigo
  ON persona.persona_estudiante (codigo_estudiante);

-- La secuencia debe quedar por encima del mayor correlativo ya emitido para que
-- una re-ejecución no intente reutilizar un código existente.
SELECT setval(
  'persona.persona_estudiante_codigo_seq',
  GREATEST(
    (SELECT COALESCE(max(substring(codigo_estudiante from 10 for 5)::bigint), 0)
       FROM persona.persona_estudiante
      WHERE codigo_estudiante ~ '^EST-[0-9]{4}-[0-9]{5}$'),
    1
  ),
  true
);
