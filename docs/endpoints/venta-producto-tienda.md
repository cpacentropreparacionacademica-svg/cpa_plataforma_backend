# Punto de venta de productos de tienda

Endpoints que usa el módulo de cajero. La pantalla sólo necesita estos dos.

## 1. Catálogo del grid

```http
GET /api/inventario/catalogo-tienda?limit=200&search=cuaderno&soloConStock=true
X-Session-Token: <sessionToken>
```

Permiso: `INVENTARIO.CATALOGO_TIENDA.READ`.

Devuelve únicamente bienes activos con `es_producto_tienda = true`, leídos de la
vista `inventario.v_stock_bien`. No es el CRUD genérico de `inventario/bien`
a propósito: el cajero no debe poder listar ni escribir el resto del inventario.

```json
{
  "success": true,
  "message": "Catálogo de tienda listado correctamente.",
  "data": [
    {
      "id_bien": 15,
      "sku": "CUAD-A4",
      "nombre": "Cuaderno A4 100 hojas",
      "categoria": "Papelería",
      "imagen_url": "https://res.cloudinary.com/<cloud>/image/upload/v1/cpa/productos/cuaderno.png",
      "precio_referencia": 12.5,
      "moneda": "BOB",
      "cantidad_disponible": 24,
      "controla_inventario": true
    }
  ],
  "count": 1,
  "total": 1
}
```

| Parámetro | Tipo | Comentario |
|---|---|---|
| `search` | string | Coincide contra `nombre` o `sku`, sin distinguir mayúsculas. |
| `categoria` | string | Filtro exacto. |
| `soloConStock` | `true`/`false` | Oculta los productos sin existencia. |
| `limit` | number | Máximo 200, por defecto 100. |
| `page` / `offset` | number | Paginación estándar. |

## 2. Confirmar la venta

```http
POST /api/contabilidad/venta-producto/registrar
Content-Type: application/json
X-Session-Token: <sessionToken>
```

Permiso: `CONTABILIDAD.VENTA_PRODUCTO.REGISTRAR`.

```json
{
  "fecha": "2026-09-03",
  "moneda": "BOB",
  "monto_efectivo": 50,
  "monto_qr": 0,
  "id_tienda": 1,
  "id_espacio_salida": 4,
  "items": [
    { "id_bien": 15, "cantidad": 2, "precio_unitario": 12.5 },
    { "id_bien": 22, "cantidad": 1, "precio_unitario": 15 }
  ]
}
```

### Campos

| Campo | Obligatorio | Comentario |
|---|---|---|
| `fecha` | No | `YYYY-MM-DD`. Por defecto, hoy. |
| `monto_efectivo` / `monto_qr` | Al menos uno > 0 | Alias aceptados: `efectivo`, `qr`. |
| `items[].id_bien` | Sí | Alias: `id_producto_tienda`, `id_producto`. |
| `items[].cantidad` | Sí | Mayor a cero. |
| `items[].precio_unitario` | No | Si va en cero se usa `bien.precio_referencia`. |
| `items[].porcentaje_descuento` | No | 0 a 100. Se aplica el mayor entre este y `monto_descuento`. |
| `id_tienda`, `id_sucursal`, `id_cliente` | No | Trazabilidad de la venta. |
| `id_espacio_salida` | No | Espacio del que sale la mercadería. |

### Qué escribe, en una sola transacción SQL

1. `contabilidad.transaccion` — `VENTA` / `VENTA_PRODUCTO_TIENDA`
2. `contabilidad.transaccion_detalle_venta` — una fila por producto
3. `contabilidad.transaccion_venta` — cabecera con las formas de pago
4. `inventario.movimiento_detalle` — una salida por lote consumido
5. `contabilidad.transaccion_movimiento_cuenta` — el asiento

Si algo falla se revierte todo: nunca queda venta sin asiento ni stock
descargado sin venta.

### Asiento generado

| Movimiento | Debe | Haber |
|---|---|---|
| Caja efectivo (`CANAL_COBRO_EFECTIVO`) | efectivo aplicado | |
| QR (`CANAL_COBRO_QR`) | cobro por QR | |
| Ingreso (`INGRESO_VENTA_PRODUCTO_TIENDA`) | | total de la venta |
| Costo de venta (`COSTO_VENTA_PRODUCTO_TIENDA`) | costo de la mercadería | |
| Existencias (`EXISTENCIAS_PRODUCTO_TIENDA`) | | costo de la mercadería |

El **efectivo aplicado** es `total − QR`, no lo que el cliente entregó: el cambio
no es un ingreso y no puede llegar al asiento. Si un bien declara
`id_cuenta_ingreso`, `id_cuenta_costo_venta` o `id_cuenta_existencias`, esas
cuentas ganan sobre la configuración global.

### Respuesta

```json
{
  "success": true,
  "message": "Venta registrada correctamente por 40 BOB.",
  "data": {
    "transaccion": { "id_transaccion": 512, "tipo_transaccion": "VENTA" },
    "transaccion_venta": { "id_transaccion": 512, "monto_total": "40.000000" },
    "detalle_venta": [{ "id_detalle_venta": 900, "numero_linea": 1 }],
    "movimientos_inventario": [{ "id_movimiento": 77, "id_lote": 3, "cantidad": "2.000000" }],
    "movimientos": [{ "id_movimiento": 1201, "id_cuenta": 10, "debe": "40.00", "haber": "0.00" }],
    "monto_total": 40,
    "costo_total": 18,
    "monto_efectivo": 40,
    "monto_qr": 0,
    "efectivo_recibido": 50,
    "cambio": 10
  }
}
```

### Errores frecuentes

| Situación | Mensaje |
|---|---|
| Stock insuficiente | `Stock insuficiente de Cuaderno A4 (SKU CUAD-A4): se solicitaron 5 y hay 3 disponibles.` |
| Pago incompleto | `El pago no cubre la venta: recibido=30, total=40. Faltan 10.` |
| QR de más | `El cobro por QR (50) supera el total de la venta (40).` |
| Producto ajeno a tienda | `... no está marcado como producto de tienda y no puede venderse en caja.` |
| Periodo cerrado | Lo bloquea el trigger `trg_transaccion_periodo_cerrado`. |

## Valuación del costo

La sigue `inventario.bien.metodo_valuacion`:

- **PEPS** — consume primero los lotes de `fecha_compra` más antigua.
- **UEPS** — consume primero los más recientes.
- **PROM** — reparte igual que PEPS pero valúa todo al promedio ponderado de los
  lotes disponibles.

Mercadería no loteable y bienes sin control de inventario se valúan al costo
promedio publicado por `inventario.v_stock_bien`, con `costo_referencia` como
respaldo.
