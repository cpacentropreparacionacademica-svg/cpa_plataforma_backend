# Corrección de listado CRUD para frontend

## Problema

Algunos frontends consumen el listado CRUD esperando que los registros estén en una de estas formas:

```json
{ "data": [ ... ] }
```

```json
{ "data": { "rows": [ ... ], "count": 10 } }
```

```json
{ "rows": [ ... ], "count": 10 }
```

El backend NestJS originalmente respondía principalmente en el formato:

```json
{
  "success": true,
  "data": {
    "count": 10,
    "rows": [ ... ],
    "limit": 20,
    "offset": 0
  },
  "pagination": {
    "count": 10,
    "limit": 20,
    "offset": 0
  }
}
```

Si el frontend solo hacía `setRows(response.data.data)` podía recibir un objeto en vez de un arreglo y no mostrar registros.

## Solución aplicada

Ahora el endpoint de listado devuelve varios aliases compatibles:

```json
{
  "success": true,
  "data": {
    "count": 10,
    "rows": [ ... ],
    "limit": 20,
    "offset": 0
  },
  "rows": [ ... ],
  "items": [ ... ],
  "records": [ ... ],
  "count": 10,
  "total": 10,
  "pagination": {
    "count": 10,
    "total": 10,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "pages": 1
  },
  "meta": {
    "count": 10,
    "total": 10,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "pages": 1
  }
}
```

## Modo plano opcional

Si el frontend quiere que `data` sea directamente el arreglo:

```http
GET /api/contabilidad/cuenta?flat=true
```

Respuesta:

```json
{
  "success": true,
  "data": [ ... ],
  "rows": [ ... ],
  "items": [ ... ],
  "count": 10
}
```

También acepta:

```http
?format=array
?format=flat
```

## Filtro estado_registro

También se corrigió el filtro por `estado_registro` para que no oculte datos por diferencia de mayúsculas/minúsculas:

```http
GET /api/contabilidad/cuenta?estado_registro=ACTIVO
GET /api/contabilidad/cuenta?estado_registro=Activo
GET /api/contabilidad/cuenta?estado_registro=activo
```

Los tres devuelven los mismos registros activos.
