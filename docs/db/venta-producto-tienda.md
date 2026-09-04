# Modelo de datos del punto de venta

Cambios introducidos por `018_punto_venta_tienda.sql` y `019_permisos_cajero_punto_venta.sql`.

## Por qué hizo falta la migración

El sistema ya tenía toda la contabilidad de la venta (`transaccion`,
`transaccion_detalle_venta`, `transaccion_venta`, `transaccion_movimiento_cuenta`),
pero faltaban tres piezas para vender productos físicos:

1. **No había imagen de producto.** `inventario.bien` no tenía dónde guardarla.
2. **No había capa de existencias.** `inventario.movimiento_detalle` no registra
   costo ni fecha, y ninguna vista consolidaba el saldo por bien o por lote.
3. **`contabilidad.transaccion.id_movimiento_detalle` es 1:1.** Una venta de
   varias líneas no cabía en ese modelo.

## `inventario.bien`

| Columna nueva | Tipo | Uso |
|---|---|---|
| `imagen_url` | `text` | URL segura de Cloudinary que muestra el grid del cajero. |
| `imagen_public_id` | `text` | `public_id` del asset, para reemplazarlo o borrarlo sin parsear la URL. |

Las columnas que ya existían y ahora son operativas: `es_producto_tienda`
(marca qué aparece en caja), `precio_referencia` (precio por defecto),
`metodo_valuacion` y `id_cuenta_ingreso` / `id_cuenta_costo_venta` /
`id_cuenta_existencias` (cuentas propias del bien).

## `inventario.movimiento_detalle`

| Columna nueva | Tipo | Uso |
|---|---|---|
| `id_transaccion` | `bigint` FK | Invierte la relación con `contabilidad.transaccion`: N movimientos por venta. |
| `costo_unitario` | `numeric(18,6)` | Costo con el que salió la mercadería, ya resuelto por valuación. |
| `fecha_movimiento` | `timestamptz` | Permite ordenar el kardex. |
| `tipo_movimiento` | `varchar(20)` | `ENTRADA`, `SALIDA`, `TRASPASO`, `AJUSTE`, `VENTA`. |
| `estado_registro` | `varchar(20)` | Permite anular un movimiento sin borrarlo. |
| `id_usuario_creador` | `bigint` | Trazabilidad. |

Todas son aditivas y nullable: las filas históricas siguen siendo válidas y el
FK legacy `transaccion.id_movimiento_detalle` se conserva intacto.

## Regla de saldo

Esta es la convención que implementan las vistas y de la que depende todo el
cálculo de stock:

- `inventario.bien_lote.cantidad_compra` es la **entrada de apertura** del lote.
- A partir de ahí, `movimiento_detalle` ajusta el saldo:
  - `id_espacio_entrada` sin `id_espacio_salida` → **suma**;
  - `id_espacio_salida` sin `id_espacio_entrada` → **resta**;
  - ambos presentes → **traspaso interno**, no altera la existencia global.
- Sólo cuentan los movimientos con `estado_registro` activo.

### `inventario.v_stock_bien_lote`

Saldo por lote, con su costo unitario. Es lo que lee la valuación PEPS/UEPS/PROM.

### `inventario.v_stock_bien`

Saldo consolidado por bien. Suma los lotes y, para mercadería no loteable, los
movimientos sin lote. Publica también `costo_promedio`, el promedio ponderado de
los lotes disponibles, con `costo_referencia` como respaldo cuando no hay lotes.

## Plan de cuentas

| Código | Nombre | Grupo nuevo |
|---|---|---|
| `4.1.05.001` | Ingresos por venta de productos de tienda | `4.1.05` |
| `5.7.001` | Costo de venta de productos de tienda | `5.7` |
| `1.1.08.001` | Materiales educativos e inventario | ya existía |

Y tres cuentas operativas configurables desde
`/api/contabilidad/configuracion-cuenta-operativa`:
`INGRESO_VENTA_PRODUCTO_TIENDA`, `COSTO_VENTA_PRODUCTO_TIENDA` y
`EXISTENCIAS_PRODUCTO_TIENDA`.

## `ck_transaccion_venta_referencia`

La restricción original obligaba a que la cabecera de venta apuntara a un
producto educativo, producto de tienda, versión de curso o clase por hora
concretos. Un carrito con varios productos no puede hacerlo: el detalle vive
por línea en `transaccion_detalle_venta`. La restricción ahora acepta además
`id_tienda IS NOT NULL`, que identifica una venta de mostrador.

## Permisos

`019` registra `INVENTARIO.CATALOGO_TIENDA.READ`,
`CONTABILIDAD.VENTA_PRODUCTO.REGISTRAR` y `CONTABILIDAD.VENTA_PRODUCTO.READ`,
y los asigna a `CAJERO`, `ENCARGADO_TIENDA`, `ADMIN_GENERAL`, `SUPER_ADMIN` y
`CONTADOR_GENERAL`.

El rol `CAJERO` existía desde `003` pero sólo tenía el vocabulario legacy
`CAJA.*`, que ningún endpoint de la API NestJS evalúa. Por eso un cajero no
podía leer el catálogo ni registrar una venta hasta esta migración.
