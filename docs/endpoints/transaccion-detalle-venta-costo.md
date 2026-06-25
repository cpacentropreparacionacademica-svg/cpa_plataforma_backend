# Endpoints nuevos: detalle de venta y costo

## Detalle de transacción de venta

```http
GET /api/contabilidad/transaccion-detalle-venta
GET /api/contabilidad/transaccion-detalle-venta/:id_detalle_venta
POST /api/contabilidad/transaccion-detalle-venta
PATCH /api/contabilidad/transaccion-detalle-venta/:id_detalle_venta
PUT /api/contabilidad/transaccion-detalle-venta/:id_detalle_venta
```

Payload mínimo recomendado:

```json
{
  "id_transaccion": 1,
  "numero_linea": 1,
  "descripcion": "Venta de curso o producto",
  "cantidad": 1,
  "precio_unitario": 250,
  "moneda": "BOB"
}
```

La transacción padre debe ser:

```json
{
  "tipo_transaccion": "VENTA"
}
```

El backend calcula automáticamente:

- `monto_descuento`
- `monto_subtotal`
- `monto_impuesto`
- `monto_total`

## Detalle de transacción de costo

```http
GET /api/contabilidad/transaccion-detalle-costo
GET /api/contabilidad/transaccion-detalle-costo/:id_detalle_costo
POST /api/contabilidad/transaccion-detalle-costo
PATCH /api/contabilidad/transaccion-detalle-costo/:id_detalle_costo
PUT /api/contabilidad/transaccion-detalle-costo/:id_detalle_costo
```

Payload mínimo recomendado:

```json
{
  "id_transaccion": 2,
  "numero_linea": 1,
  "descripcion": "Costo de material didáctico",
  "cantidad": 10,
  "costo_unitario": 15,
  "moneda": "BOB"
}
```

La transacción padre debe ser:

```json
{
  "tipo_transaccion": "COSTO"
}
```

El backend calcula automáticamente:

- `monto_subtotal`
- `monto_impuesto`
- `monto_total`

## Nota para frontend

Los listados devuelven `data` directamente como arreglo:

```ts
const rows = response.data.data;
```

También se mantienen `rows`, `items` y `records` para compatibilidad.
