# Patch contable: detalle de transacción venta y costo

Este patch agrega dos tablas operativas en `contabilidad` para separar el detalle comercial/de costo de los movimientos contables de debe/haber.

## Migración

Archivo:

```txt
/docs/db/migrations/004_patch_transaccion_detalle_venta_costo.sql
```

Se ejecuta con:

```bash
yarn db:migrate:prod
```

O desde cero:

```bash
yarn db:migrate:prod:fresh
```

## Tablas nuevas

### `contabilidad.transaccion_detalle_venta`

Uso: detalle de líneas de venta de una transacción con `tipo_transaccion = 'VENTA'`.

Campos principales:

- `id_detalle_venta`
- `id_transaccion`
- `numero_linea`
- `id_cliente`
- `id_producto_educativo`
- `id_producto_tienda`
- `id_curso_version`
- `id_clase_por_hora`
- `id_tienda`
- `id_sucursal`
- `id_cuenta_ingreso`
- `descripcion`
- `cantidad`
- `precio_unitario`
- `porcentaje_descuento`
- `monto_descuento`
- `monto_subtotal`
- `porcentaje_impuesto`
- `monto_impuesto`
- `monto_total`
- `moneda`
- `observaciones`
- auditoría y `estado_registro`

Endpoint CRUD:

```http
GET    /api/contabilidad/transaccion-detalle-venta
GET    /api/contabilidad/transaccion-detalle-venta/:id_detalle_venta
POST   /api/contabilidad/transaccion-detalle-venta
PATCH  /api/contabilidad/transaccion-detalle-venta/:id_detalle_venta
PUT    /api/contabilidad/transaccion-detalle-venta/:id_detalle_venta
```

Payload ejemplo:

```json
{
  "id_transaccion": 1,
  "numero_linea": 1,
  "id_cliente": 900001,
  "id_producto_educativo": 1,
  "descripcion": "Curso de preparación matemática",
  "cantidad": 1,
  "precio_unitario": 250,
  "monto_subtotal": 250,
  "porcentaje_impuesto": 0,
  "monto_impuesto": 0,
  "monto_total": 250,
  "moneda": "BOB"
}
```

Regla fuerte:

- El trigger `trg_transaccion_detalle_venta_tipo` impide insertar este detalle si la transacción padre no es de tipo `VENTA`.

### `contabilidad.transaccion_detalle_costo`

Uso: detalle de líneas de costo/gasto de una transacción con `tipo_transaccion = 'COSTO'`.

Campos principales:

- `id_detalle_costo`
- `id_transaccion`
- `numero_linea`
- `id_centro_costo`
- `id_concepto_costo`
- `id_centro_costo_mapa`
- `id_proveedor`
- `id_empleado`
- `id_departamento`
- `id_bien`
- `id_movimiento_detalle`
- `id_sucursal`
- `id_tienda`
- `id_cuenta_costo`
- `descripcion`
- `cantidad`
- `costo_unitario`
- `monto_subtotal`
- `porcentaje_impuesto`
- `monto_impuesto`
- `monto_total`
- `moneda`
- `observaciones`
- auditoría y `estado_registro`

Endpoint CRUD:

```http
GET    /api/contabilidad/transaccion-detalle-costo
GET    /api/contabilidad/transaccion-detalle-costo/:id_detalle_costo
POST   /api/contabilidad/transaccion-detalle-costo
PATCH  /api/contabilidad/transaccion-detalle-costo/:id_detalle_costo
PUT    /api/contabilidad/transaccion-detalle-costo/:id_detalle_costo
```

Payload ejemplo:

```json
{
  "id_transaccion": 2,
  "numero_linea": 1,
  "id_centro_costo": 1,
  "id_concepto_costo": 1,
  "id_proveedor": 1,
  "descripcion": "Material didáctico para curso",
  "cantidad": 10,
  "costo_unitario": 15,
  "monto_subtotal": 150,
  "porcentaje_impuesto": 0,
  "monto_impuesto": 0,
  "monto_total": 150,
  "moneda": "BOB"
}
```

Regla fuerte:

- El trigger `trg_transaccion_detalle_costo_tipo` impide insertar este detalle si la transacción padre no es de tipo `COSTO`.

## Permisos agregados

- `CONTABILIDAD.TRANSACCION_DETALLE_VENTA.CREATE`
- `CONTABILIDAD.TRANSACCION_DETALLE_VENTA.READ`
- `CONTABILIDAD.TRANSACCION_DETALLE_VENTA.UPDATE`
- `CONTABILIDAD.TRANSACCION_DETALLE_COSTO.CREATE`
- `CONTABILIDAD.TRANSACCION_DETALLE_COSTO.READ`
- `CONTABILIDAD.TRANSACCION_DETALLE_COSTO.UPDATE`

Asignados a:

- `SUPER_ADMIN`
- `ADMIN_GENERAL`
- `CONTADOR_GENERAL`
- `CONTADOR`

## Vistas auxiliares

También se agregan:

```sql
contabilidad.v_transaccion_detalle_venta
contabilidad.v_transaccion_detalle_costo
```

Estas vistas unen el detalle con la transacción padre y nombres útiles para reporting.
