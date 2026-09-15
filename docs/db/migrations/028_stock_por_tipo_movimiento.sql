-- 028_stock_por_tipo_movimiento.sql
-- Propósito:
--   Que una venta descuente existencias aunque no declare espacio de salida.
--
-- Por qué hace falta:
--   Las vistas de `025_punto_venta_tienda.sql` deducían el signo del movimiento
--   sólo de los espacios:
--       entrada sin salida -> suma ; salida sin entrada -> resta ; resto -> 0
--   El punto de venta no pide un espacio al cajero, así que la salida se
--   registraba con ambos espacios en NULL y caía en el `ELSE 0`: el movimiento
--   quedaba guardado, pero el stock no bajaba. Una venta descontaba existencias
--   sólo en apariencia.
--
--   Ahora manda `tipo_movimiento` cuando está presente, y los espacios siguen
--   decidiendo en las filas históricas que no lo traen. Un movimiento con
--   espacio de entrada Y de salida sigue siendo un traspaso interno y no altera
--   la existencia global.

BEGIN;

CREATE OR REPLACE VIEW inventario.v_stock_bien_lote AS
WITH movimientos AS (
  SELECT
    md.id_bien,
    md.id_lote,
    SUM(
      CASE
        -- El tipo declarado manda: no depende de que se haya indicado espacio.
        WHEN md.tipo_movimiento IN ('VENTA', 'SALIDA') THEN -md.cantidad
        WHEN md.tipo_movimiento = 'ENTRADA' THEN md.cantidad
        WHEN md.tipo_movimiento = 'TRASPASO' THEN 0
        -- Filas anteriores a esta migración, sin tipo: se deduce por espacios.
        WHEN md.id_espacio_entrada IS NOT NULL AND md.id_espacio_salida IS NULL THEN md.cantidad
        WHEN md.id_espacio_salida IS NOT NULL AND md.id_espacio_entrada IS NULL THEN -md.cantidad
        ELSE 0
      END
    ) AS cantidad_neta
  FROM inventario.movimiento_detalle md
  WHERE COALESCE(md.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
  GROUP BY md.id_bien, md.id_lote
)
SELECT
  l.id_lote,
  l.id_bien,
  b.sku,
  b.nombre,
  l.lote_codigo,
  l.fecha_compra,
  l.fecha_vencimiento,
  COALESCE(l.costo_compra_unitario, l.precio_compra_unitario, b.costo_referencia, 0)::numeric(18,6) AS costo_unitario,
  l.cantidad_compra::numeric(18,6) AS cantidad_apertura,
  COALESCE(m.cantidad_neta, 0)::numeric(18,6) AS cantidad_movimientos,
  GREATEST(l.cantidad_compra + COALESCE(m.cantidad_neta, 0), 0)::numeric(18,6) AS cantidad_disponible
FROM inventario.bien_lote l
JOIN inventario.bien b ON b.id_bien = l.id_bien
LEFT JOIN movimientos m ON m.id_bien = l.id_bien AND m.id_lote = l.id_lote
WHERE COALESCE(l.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo');

CREATE OR REPLACE VIEW inventario.v_stock_bien AS
WITH stock_lotes AS (
  SELECT id_bien,
         SUM(cantidad_disponible) AS cantidad,
         SUM(cantidad_disponible * costo_unitario) AS valor
  FROM inventario.v_stock_bien_lote
  GROUP BY id_bien
), stock_sin_lote AS (
  -- Mercadería no loteable: la existencia sale íntegramente de los movimientos.
  SELECT md.id_bien,
         SUM(
           CASE
             WHEN md.tipo_movimiento IN ('VENTA', 'SALIDA') THEN -md.cantidad
             WHEN md.tipo_movimiento = 'ENTRADA' THEN md.cantidad
             WHEN md.tipo_movimiento = 'TRASPASO' THEN 0
             WHEN md.id_espacio_entrada IS NOT NULL AND md.id_espacio_salida IS NULL THEN md.cantidad
             WHEN md.id_espacio_salida IS NOT NULL AND md.id_espacio_entrada IS NULL THEN -md.cantidad
             ELSE 0
           END
         ) AS cantidad
  FROM inventario.movimiento_detalle md
  WHERE md.id_lote IS NULL
    AND COALESCE(md.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
  GROUP BY md.id_bien
)
SELECT
  b.id_bien,
  b.sku,
  b.nombre,
  b.tipo,
  b.categoria,
  b.imagen_url,
  b.precio_referencia,
  b.costo_referencia,
  b.moneda_referencia,
  b.metodo_valuacion,
  b.controla_inventario_loteable,
  b.controla_inventario_no_loteable,
  b.es_producto_tienda,
  b.estado_registro,
  COALESCE(sl.cantidad, 0)::numeric(18,6) + COALESCE(ss.cantidad, 0)::numeric(18,6) AS cantidad_disponible,
  COALESCE(sl.valor, 0)::numeric(18,6) AS valor_lotes,
  CASE
    WHEN COALESCE(sl.cantidad, 0) > 0 THEN (sl.valor / sl.cantidad)::numeric(18,6)
    ELSE COALESCE(b.costo_referencia, 0)::numeric(18,6)
  END AS costo_promedio
FROM inventario.bien b
LEFT JOIN stock_lotes    sl ON sl.id_bien = b.id_bien
LEFT JOIN stock_sin_lote ss ON ss.id_bien = b.id_bien;

COMMIT;
