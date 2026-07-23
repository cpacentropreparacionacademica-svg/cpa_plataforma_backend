-- Migration: 018_fix_kpi_unidad_medida_consistencia.sql
-- Propósito: normalizar la unidad de medida de los KPI para que el catálogo sea
--   internamente consistente.
--
--   El seed base (003_seed_production_users.sql) registra los KPI porcentuales con
--   la unidad '%'. Un KPI creado posteriormente desde la UI
--   ("Crecimiento marginal ventas globales mes anterior") quedó con la unidad
--   'PORCENTAJE', rompiendo la convención y mostrando dos formas distintas de la
--   misma unidad en la misma tabla.
--
--   Esta migración:
--     1. Normaliza cualquier variante textual de "porcentaje" a '%'.
--     2. Reseeda de forma idempotente el KPI de crecimiento marginal con la unidad
--        correcta, de modo que las bases nuevas queden alineadas con las existentes.
--
-- Idempotente.

-- ---------------------------------------------------------------------------
-- 1. Normalizar variantes de la unidad porcentual a '%'
-- ---------------------------------------------------------------------------
UPDATE administracion.kpi
   SET unidad_medida = '%',
       fecha_modificacion = now()
 WHERE upper(btrim(unidad_medida)) IN ('PORCENTAJE', 'PORCENTUAL', 'PERCENT', 'PORC', 'PCT')
   AND unidad_medida <> '%';

-- ---------------------------------------------------------------------------
-- 2. Reseed idempotente del KPI de crecimiento marginal con unidad '%'
--    (para que las bases nuevas incluyan el mismo indicador ya normalizado)
-- ---------------------------------------------------------------------------
INSERT INTO administracion.kpi (nombre, descripcion, unidad_medida, frecuencia, estado_registro)
SELECT 'Crecimiento marginal ventas globales mes anterior',
       'Variación porcentual del crecimiento en ventas globales con respecto al mes anterior.',
       '%', 'MENSUAL', 'Activo'
 WHERE NOT EXISTS (
   SELECT 1 FROM administracion.kpi
    WHERE nombre = 'Crecimiento marginal ventas globales mes anterior'
 );
