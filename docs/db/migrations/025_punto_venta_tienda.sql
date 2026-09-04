-- 025_punto_venta_tienda.sql
-- Propósito:
--   1) Permitir que un bien de tienda tenga imagen (Cloudinary) para el grid del cajero.
--   2) Convertir inventario.movimiento_detalle en un movimiento trazable por transacción,
--      con costo y fecha, para poder descargar stock y registrar costo de venta.
--   3) Publicar vistas de stock por lote y por bien (no existía ninguna capa de existencias).
--   4) Sembrar las cuentas contables de ingreso, costo y existencias de productos de tienda.
--   5) Permitir que una venta de mostrador agrupe varias líneas bajo una sola cabecera.
--
-- Todo el archivo es idempotente: puede ejecutarse varias veces sin efectos adicionales.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Imagen del producto de tienda.
--    El frontend sube a Cloudinary con un preset unsigned y guarda aquí la URL
--    resultante. Se conserva el public_id para poder reemplazar o borrar el
--    asset sin tener que derivarlo parseando la URL.
-- ---------------------------------------------------------------------------
ALTER TABLE inventario.bien
  ADD COLUMN IF NOT EXISTS imagen_url text,
  ADD COLUMN IF NOT EXISTS imagen_public_id text;

COMMENT ON COLUMN inventario.bien.imagen_url IS
  'URL segura de Cloudinary usada por el grid del punto de venta. NULL muestra el placeholder.';

-- ---------------------------------------------------------------------------
-- 2. Movimiento de inventario trazable.
--    contabilidad.transaccion.id_movimiento_detalle sólo permite referenciar UN
--    movimiento por transacción, de modo que una venta de varias líneas no cabía.
--    Se invierte la relación: cada movimiento apunta a su transacción (1:N).
--    Las columnas son aditivas y nullable para no invalidar filas históricas.
-- ---------------------------------------------------------------------------
ALTER TABLE inventario.movimiento_detalle
  ADD COLUMN IF NOT EXISTS id_transaccion    bigint,
  ADD COLUMN IF NOT EXISTS costo_unitario    numeric(18,6),
  ADD COLUMN IF NOT EXISTS fecha_movimiento  timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tipo_movimiento   character varying(20),
  ADD COLUMN IF NOT EXISTS estado_registro   character varying(20) DEFAULT 'Activo'::character varying,
  ADD COLUMN IF NOT EXISTS id_usuario_creador bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'movimiento_detalle_id_transaccion_fkey'
      AND conrelid = 'inventario.movimiento_detalle'::regclass
  ) THEN
    ALTER TABLE inventario.movimiento_detalle
      ADD CONSTRAINT movimiento_detalle_id_transaccion_fkey
      FOREIGN KEY (id_transaccion) REFERENCES contabilidad.transaccion(id_transaccion);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_movimiento_detalle_tipo'
      AND conrelid = 'inventario.movimiento_detalle'::regclass
  ) THEN
    ALTER TABLE inventario.movimiento_detalle
      ADD CONSTRAINT ck_movimiento_detalle_tipo CHECK (
        tipo_movimiento IS NULL
        OR tipo_movimiento IN ('ENTRADA', 'SALIDA', 'TRASPASO', 'AJUSTE', 'VENTA')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_movimiento_detalle_costo'
      AND conrelid = 'inventario.movimiento_detalle'::regclass
  ) THEN
    ALTER TABLE inventario.movimiento_detalle
      ADD CONSTRAINT ck_movimiento_detalle_costo CHECK (costo_unitario IS NULL OR costo_unitario >= 0);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS ix_mvdet_transaccion
  ON inventario.movimiento_detalle (id_transaccion)
  WHERE id_transaccion IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Vistas de existencias.
--    Regla de saldo documentada en docs/db/venta-producto-tienda.md:
--      * inventario.bien_lote.cantidad_compra es la ENTRADA DE APERTURA del lote.
--      * A partir de ahí, movimiento_detalle suma entradas y resta salidas.
--      * Un movimiento con espacio de entrada Y de salida es un traspaso interno
--        y por lo tanto no altera la existencia global del bien.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW inventario.v_stock_bien_lote AS
WITH movimientos AS (
  SELECT
    md.id_bien,
    md.id_lote,
    SUM(
      CASE
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

COMMENT ON VIEW inventario.v_stock_bien_lote IS
  'Existencia disponible por lote. cantidad_compra del lote es la entrada de apertura; movimiento_detalle la ajusta.';

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

COMMENT ON VIEW inventario.v_stock_bien IS
  'Existencia consolidada por bien, con costo promedio ponderado de los lotes disponibles.';

-- ---------------------------------------------------------------------------
-- 4. Cuentas contables de productos de tienda.
--    El plan estandarizado (migración 010) cubre clases y servicios, pero no
--    tenía ingreso ni costo de venta de mercadería.
-- ---------------------------------------------------------------------------
INSERT INTO contabilidad.grupo_cuenta (codigo, nombre, id_parent, tipo, sub_tipo, sub_grupo, orden_reporte, estado_registro)
SELECT g.codigo, g.nombre, parent.id_grupo_cuenta, g.tipo, g.sub_tipo, g.sub_grupo, g.orden_reporte, 'Activo'
FROM (VALUES
  ('4.1.05', 'Ingresos por venta de productos de tienda', '4.1', 'RESULTADOS', 'INGRESO', 'ORDINARIO', 32),
  ('5.7',    'Costo de venta de mercadería',              '5',   'RESULTADOS', 'GASTO',   'ORDINARIO', 39)
) AS g(codigo, nombre, parent_codigo, tipo, sub_tipo, sub_grupo, orden_reporte)
JOIN contabilidad.grupo_cuenta parent ON parent.codigo = g.parent_codigo
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO contabilidad.cuenta (codigo, nombre_cuenta, id_grupo_cuenta, estado_registro)
SELECT c.codigo, c.nombre_cuenta, g.id_grupo_cuenta, 'Activo'
FROM (VALUES
  ('4.1.05.001', 'Ingresos por venta de productos de tienda', '4.1.05'),
  ('5.7.001',    'Costo de venta de productos de tienda',     '5.7')
) AS c(codigo, nombre_cuenta, codigo_grupo)
JOIN contabilidad.grupo_cuenta g ON g.codigo = c.codigo_grupo
ON CONFLICT (codigo) DO NOTHING;

-- Cuentas operativas configurables desde el frontend, igual que los canales de cobro.
INSERT INTO contabilidad.configuracion_cuenta_operativa (codigo, nombre, descripcion, id_cuenta)
SELECT cfg.codigo, cfg.nombre, cfg.descripcion, c.id_cuenta
FROM (VALUES
  ('INGRESO_VENTA_PRODUCTO_TIENDA', 'Ingreso por venta de productos de tienda',
   'Cuenta de ingreso usada por defecto al confirmar una venta en el punto de venta.', '4.1.05.001'),
  ('COSTO_VENTA_PRODUCTO_TIENDA', 'Costo de venta de productos de tienda',
   'Cuenta de gasto donde se reconoce el costo de la mercadería vendida.', '5.7.001'),
  ('EXISTENCIAS_PRODUCTO_TIENDA', 'Existencias de productos de tienda',
   'Cuenta de activo que se acredita al dar de baja la mercadería vendida.', '1.1.08.001')
) AS cfg(codigo, nombre, descripcion, codigo_cuenta)
JOIN contabilidad.cuenta c ON c.codigo = cfg.codigo_cuenta
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    estado_registro = 'Activo';

-- ---------------------------------------------------------------------------
-- 5. Venta de mostrador con varias líneas.
--    ck_transaccion_venta_referencia (migración 011) obligaba a que la cabecera
--    apuntara a UN producto concreto, lo que impide un carrito multi-producto.
--    Se admite además una venta identificada por tienda: el detalle por línea
--    vive en contabilidad.transaccion_detalle_venta.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_transaccion_venta_referencia'
      AND conrelid = 'contabilidad.transaccion_venta'::regclass
  ) THEN
    ALTER TABLE contabilidad.transaccion_venta DROP CONSTRAINT ck_transaccion_venta_referencia;
  END IF;

  ALTER TABLE contabilidad.transaccion_venta
    ADD CONSTRAINT ck_transaccion_venta_referencia CHECK (
      id_producto_educativo IS NOT NULL
      OR id_producto_tienda IS NOT NULL
      OR id_curso_version IS NOT NULL
      OR id_clase_por_hora IS NOT NULL
      OR id_tienda IS NOT NULL
    );
END;
$$;

COMMIT;
