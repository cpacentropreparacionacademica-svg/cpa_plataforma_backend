-- Reset destructivo: 000_drop_existing_tables_if_exists.sql
-- Propósito: limpiar la base antes de reconstruir los schemas productivos.
-- Uso recomendado:
--   yarn db:migrate:prod:fresh
--
-- ADVERTENCIA: este archivo elimina tablas, funciones, tipos, secuencias y objetos
-- de los schemas funcionales del sistema CPA. No se ejecuta con db:migrate:prod normal.

DO $$
DECLARE
  target_schema text;
  target_table record;
  target_schemas text[] := ARRAY[
    'administracion',
    'contabilidad',
    'deuda',
    'infraestructura',
    'inventario',
    'persona',
    'seguridad',
    'servicios_educativos',
    'societario'
  ];
BEGIN
  -- Primero se ejecuta DROP TABLE IF EXISTS para cumplir explícitamente
  -- la limpieza de tablas antes de crear nuevamente el modelo.
  FOREACH target_schema IN ARRAY target_schemas LOOP
    FOR target_table IN
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname = target_schema
    LOOP
      EXECUTE format(
        'DROP TABLE IF EXISTS %I.%I CASCADE',
        target_table.schemaname,
        target_table.tablename
      );
    END LOOP;
  END LOOP;
END $$;

-- Además de tablas, el DDL productivo crea ENUMs, funciones, secuencias y otros objetos.
-- Si solo se borran tablas, PostgreSQL falla después por tipos/funciones ya existentes.
-- Por eso se eliminan los schemas funcionales completos y luego 001 los crea nuevamente.
DROP SCHEMA IF EXISTS administracion CASCADE;
DROP SCHEMA IF EXISTS contabilidad CASCADE;
DROP SCHEMA IF EXISTS deuda CASCADE;
DROP SCHEMA IF EXISTS infraestructura CASCADE;
DROP SCHEMA IF EXISTS inventario CASCADE;
DROP SCHEMA IF EXISTS persona CASCADE;
DROP SCHEMA IF EXISTS seguridad CASCADE;
DROP SCHEMA IF EXISTS servicios_educativos CASCADE;
DROP SCHEMA IF EXISTS societario CASCADE;
