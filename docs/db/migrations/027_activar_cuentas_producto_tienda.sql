-- 027_activar_cuentas_producto_tienda.sql
-- Propósito:
--   Dejar activas las cuentas contables del punto de venta de tienda.
--
-- Por qué hace falta:
--   `002_seed_plan_cuentas_fundamental.sql` ya había creado `4.1.05.001` y
--   `5.7.001`, y `010_seed_plan_cuentas_cpa_estandarizado.sql` desactivó todas
--   las cuentas fuera de su lista canónica, que no las incluye. Como
--   `025_punto_venta_tienda.sql` las inserta con `ON CONFLICT (codigo) DO NOTHING`,
--   no las reactivaba: seguían en 'Inactivo'.
--
--   El efecto era que confirmar una venta fallaba con
--     «No se encontró cuenta de ingreso por venta de productos de tienda.
--      Código buscado: 4.1.05.001»
--   porque la resolución de cuentas sólo considera las activas.
--
-- Es idempotente y sirve tanto si 025 ya se aplicó como si se aplica después.

BEGIN;

-- 1. Grupos contenedores. 010 también los desactivó.
UPDATE contabilidad.grupo_cuenta
   SET estado_registro = 'Activo',
       fecha_modificacion = NOW(),
       version_registro = COALESCE(version_registro, 1) + 1
 WHERE codigo IN ('4.1.05', '5.7')
   AND COALESCE(estado_registro, 'Activo') NOT IN ('Activo', 'ACTIVO', 'activo');

-- 2. Las cuentas del punto de venta.
UPDATE contabilidad.cuenta
   SET estado_registro = 'Activo',
       fecha_modificacion = NOW(),
       version_registro = COALESCE(version_registro, 1) + 1
 WHERE codigo IN ('4.1.05.001', '5.7.001', '1.1.08.001')
   AND COALESCE(estado_registro, 'Activo') NOT IN ('Activo', 'ACTIVO', 'activo');

-- 3. La configuración operativa debe apuntar a esas cuentas y estar activa.
--    Si 025 no llegó a crearla (por ejemplo porque falló antes), se crea aquí.
INSERT INTO contabilidad.configuracion_cuenta_operativa (codigo, nombre, descripcion, id_cuenta)
SELECT cfg.codigo, cfg.nombre, cfg.descripcion, c.id_cuenta
FROM (VALUES
  ('INGRESO_VENTA_PRODUCTO_TIENDA', 'Ingreso por venta de productos de tienda',
   'Cuenta de ingreso usada al confirmar una venta en el punto de venta.', '4.1.05.001'),
  ('COSTO_VENTA_PRODUCTO_TIENDA', 'Costo de venta de productos de tienda',
   'Cuenta de gasto donde se reconoce el costo de la mercadería vendida.', '5.7.001'),
  ('EXISTENCIAS_PRODUCTO_TIENDA', 'Existencias de productos de tienda',
   'Cuenta de activo que se acredita al dar de baja la mercadería vendida.', '1.1.08.001')
) AS cfg(codigo, nombre, descripcion, codigo_cuenta)
JOIN contabilidad.cuenta c ON c.codigo = cfg.codigo_cuenta
ON CONFLICT (codigo) DO UPDATE
SET id_cuenta = EXCLUDED.id_cuenta,
    estado_registro = 'Activo',
    fecha_modificacion = NOW();

-- 4. Verificación: si algo quedó inactivo, la migración falla en vez de dejar
--    el punto de venta roto en silencio.
DO $$
DECLARE
  faltantes text;
BEGIN
  SELECT string_agg(cfg.codigo, ', ')
    INTO faltantes
  FROM (VALUES
    ('INGRESO_VENTA_PRODUCTO_TIENDA'), ('COSTO_VENTA_PRODUCTO_TIENDA'), ('EXISTENCIAS_PRODUCTO_TIENDA')
  ) AS cfg(codigo)
  WHERE NOT EXISTS (
    SELECT 1
    FROM contabilidad.configuracion_cuenta_operativa cco
    JOIN contabilidad.cuenta c ON c.id_cuenta = cco.id_cuenta
    WHERE cco.codigo = cfg.codigo
      AND COALESCE(cco.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
      AND COALESCE(c.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
  );

  IF faltantes IS NOT NULL THEN
    RAISE EXCEPTION 'Cuentas operativas del punto de venta sin resolver: %', faltantes;
  END IF;
END;
$$;

COMMIT;
