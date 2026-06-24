# Fix definitivo de contrato de listados para frontend

## Problema

El frontend no mostraba registros aunque la base de datos sí tenía filas.
La causa más probable era el contrato de respuesta de `GET list`.

Antes el frontend suele leer:

```ts
const rows = response.data.data;
```

y espera que `rows` sea directamente un arreglo.

El backend había pasado a devolver:

```json
{
  "success": true,
  "data": {
    "count": 10,
    "rows": []
  }
}
```

Eso rompe tablas que hacen `.map(...)` sobre `response.data.data`.

## Corrección aplicada

Ahora los endpoints de listado devuelven por defecto:

```json
{
  "success": true,
  "message": "cuenta listado correctamente.",
  "data": [
    {
      "id_cuenta": 1,
      "codigo": "1.1.01.001",
      "nombre_cuenta": "Caja moneda nacional"
    }
  ],
  "rows": [
    {
      "id_cuenta": 1,
      "codigo": "1.1.01.001",
      "nombre_cuenta": "Caja moneda nacional"
    }
  ],
  "items": [
    {
      "id_cuenta": 1,
      "codigo": "1.1.01.001",
      "nombre_cuenta": "Caja moneda nacional"
    }
  ],
  "records": [
    {
      "id_cuenta": 1,
      "codigo": "1.1.01.001",
      "nombre_cuenta": "Caja moneda nacional"
    }
  ],
  "count": 1,
  "total": 1,
  "pagination": {
    "count": 1,
    "total": 1,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "pages": 1
  }
}
```

## Lecturas válidas desde frontend

Cualquiera de estas formas funciona:

```ts
response.data.data
response.data.rows
response.data.items
response.data.records
```

## Compatibilidad con formato anterior objeto

Si alguna herramienta necesita el formato anterior `{ count, rows, limit, offset }` dentro de `data`, puede llamar:

```http
GET /api/contabilidad/cuenta?dataShape=legacy
```

O:

```http
GET /api/contabilidad/cuenta?format=legacy
```

En ese modo `data` vuelve a ser:

```json
{
  "count": 10,
  "rows": [],
  "limit": 20,
  "offset": 0
}
```
