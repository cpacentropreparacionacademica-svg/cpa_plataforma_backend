# Endpoints batch y contabilidad avanzada

## Batch genérico por recurso

Los módulos CRUD ahora aceptan creación y actualización múltiple en batch. La operación se ejecuta de forma transaccional: si un item falla, se revierte todo el lote.

### Crear múltiples registros

```http
POST /api/{modulo}/{recurso}/batch
X-Session-Token: <sessionToken>
Content-Type: application/json
```

Payload permitido como objeto:

```json
{
  "items": [
    { "campo_1": "valor 1" },
    { "campo_1": "valor 2" }
  ]
}
```

También se acepta arreglo directo:

```json
[
  { "campo_1": "valor 1" },
  { "campo_1": "valor 2" }
]
```

Respuesta esperada:

```json
{
  "success": true,
  "message": "2 registro(s) de departamento creados correctamente.",
  "data": [],
  "count": 2
}
```

### Actualizar múltiples registros

```http
PATCH /api/{modulo}/{recurso}/batch
X-Session-Token: <sessionToken>
Content-Type: application/json
```

Payload recomendado:

```json
{
  "items": [
    {
      "ids": { "id_departamento": 1 },
      "data": { "descripcion": "Actualizado desde batch" }
    },
    {
      "ids": { "id_departamento": 2 },
      "data": { "descripcion": "Actualizado desde batch" }
    }
  ]
}
```

También se permite enviar PK y datos en el mismo objeto:

```json
{
  "items": [
    { "id_departamento": 1, "descripcion": "Actualizado desde batch" },
    { "id_departamento": 2, "descripcion": "Actualizado desde batch" }
  ]
}
```

## Crear transacción contable con movimientos en batch

Crea un asiento contable y sus movimientos de cuenta en una sola transacción SQL. Si un movimiento falla, no se crea nada.

```http
POST /api/contabilidad/transaccion/con-movimientos
X-Session-Token: <sessionToken>
Content-Type: application/json
```

Payload mínimo:

```json
{
  "transaccion": {
    "tipo_transaccion": "GENERAL",
    "fecha_transaccion": "2026-06-21",
    "sub_tipo_transaccion": "ASIENTO_MANUAL",
    "glosa": "Asiento contable manual de prueba"
  },
  "movimientos": [
    {
      "id_cuenta": 5,
      "debe": 150,
      "haber": 0
    },
    {
      "id_cuenta": 6,
      "debe": 0,
      "haber": 150
    }
  ]
}
```

Validaciones:

- `transaccion.tipo_transaccion` es obligatorio.
- `movimientos` debe tener al menos 2 items.
- Cada movimiento debe tener `id_cuenta`.
- `debe` y `haber` no pueden ser negativos.
- Un movimiento no puede tener `debe` y `haber` positivos al mismo tiempo.
- El total del debe debe ser igual al total del haber.

Respuesta esperada:

```json
{
  "success": true,
  "message": "Transacción registrada correctamente con movimientos de cuenta en batch.",
  "data": {
    "transaccion": {
      "id_transaccion": 10,
      "tipo_transaccion": "GENERAL"
    },
    "movimientos": [
      {
        "id_movimiento": 20,
        "id_transaccion": 10,
        "id_cuenta": 5,
        "debe": 150,
        "haber": 0
      },
      {
        "id_movimiento": 21,
        "id_transaccion": 10,
        "id_cuenta": 6,
        "debe": 0,
        "haber": 150
      }
    ],
    "totales": {
      "debe": 150,
      "haber": 150
    }
  }
}
```

## Revertir asiento contable

Dado un asiento/transacción existente, crea un nuevo asiento reverso con los mismos movimientos invertidos: lo que estaba en debe pasa a haber y lo que estaba en haber pasa a debe.

```http
POST /api/contabilidad/transaccion/{id_transaccion}/revert
X-Session-Token: <sessionToken>
Content-Type: application/json
```

Payload mínimo:

```json
{
  "motivo": "Corrección de registro contable",
  "fecha_transaccion": "2026-06-21"
}
```

También se puede mandar glosa personalizada:

```json
{
  "glosa": "Reversión por error en asiento original",
  "fecha_transaccion": "2026-06-21"
}
```

Respuesta esperada:

```json
{
  "success": true,
  "message": "Asiento revertido correctamente con movimientos inversos.",
  "data": {
    "asiento_original": {
      "id_transaccion": 3
    },
    "asiento_reverso": {
      "id_transaccion": 11,
      "sub_tipo_transaccion": "REVERSO"
    },
    "movimientos_reverso": [
      {
        "id_cuenta": 5,
        "debe": 0,
        "haber": 150
      },
      {
        "id_cuenta": 6,
        "debe": 150,
        "haber": 0
      }
    ],
    "totales": {
      "debe": 150,
      "haber": 150
    }
  }
}
```

Notas:

- No modifica físicamente el asiento original.
- Crea una nueva transacción con `sub_tipo_transaccion = 'REVERSO'`.
- Mantiene referencias contextuales del asiento original cuando existan.
- Valida que el asiento original tenga movimientos activos.
- Valida que la reversión quede balanceada.
