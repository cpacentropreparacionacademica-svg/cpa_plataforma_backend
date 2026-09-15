-- 026_permisos_cajero_punto_venta.sql
-- Propósito:
--   1) Registrar los permisos que consume el módulo de punto de venta del cajero.
--   2) Asignarlos al rol CAJERO, que hoy sólo tiene el vocabulario legacy CAJA.*
--      y por lo tanto no puede leer el catálogo de tienda ni registrar la venta.
--   3) Dar el mismo acceso a los roles que ya operan tienda e inventario.
--
-- Idempotente: puede ejecutarse varias veces sin duplicar permisos ni asignaciones.

BEGIN;

INSERT INTO seguridad.permiso (codigo, descripcion, modulo, estado_registro)
VALUES
  ('INVENTARIO.CATALOGO_TIENDA.READ',
   'Leer el catálogo de productos de tienda con existencias e imagen', 'INVENTARIO', 'Activo'),
  ('CONTABILIDAD.VENTA_PRODUCTO.REGISTRAR',
   'Confirmar una venta de productos de tienda con asiento contable y descarga de stock', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.VENTA_PRODUCTO.READ',
   'Consultar las ventas de productos de tienda registradas', 'CONTABILIDAD', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  modulo = EXCLUDED.modulo,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.permiso.version_registro, 1) + 1;

-- El cajero necesita además poder leer los datos mínimos que la pantalla muestra.
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY[
  'INVENTARIO.CATALOGO_TIENDA.READ',
  'CONTABILIDAD.VENTA_PRODUCTO.REGISTRAR',
  'CONTABILIDAD.VENTA_PRODUCTO.READ',
  'INVENTARIO.BIEN.READ',
  'CONTABILIDAD.TRANSACCION.READ'
])
WHERE r.codigo IN ('CAJERO', 'ENCARGADO_TIENDA', 'ADMIN_GENERAL', 'SUPER_ADMIN', 'CONTADOR_GENERAL')
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

COMMIT;
