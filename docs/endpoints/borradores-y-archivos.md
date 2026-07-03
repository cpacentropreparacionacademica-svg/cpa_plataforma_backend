# Borradores y archivos independientes

## 1. Registros en borrador

El backend soporta borradores genéricos para cualquier pantalla o recurso sin insertar registros incompletos en las tablas finales.

### CRUD oficial

Base URL:

```http
/api/administracion/registro-borrador
```

Endpoints:

```http
GET    /api/administracion/registro-borrador
GET    /api/administracion/registro-borrador/:id_borrador
POST   /api/administracion/registro-borrador
PATCH  /api/administracion/registro-borrador/:id_borrador
PUT    /api/administracion/registro-borrador/:id_borrador
POST   /api/administracion/registro-borrador/batch
PATCH  /api/administracion/registro-borrador/batch
POST   /api/administracion/registro-borrador/batch/validate
POST   /api/administracion/registro-borrador/batch/process
```

Payload mínimo recomendado:

```json
{
  "modulo": "personas",
  "recurso": "estudiante",
  "operacion": "create",
  "titulo": "Nuevo estudiante - borrador",
  "payload_json": {
    "nombres": "Ana",
    "apellidos": "Pérez"
  },
  "metadata_json": {
    "pantalla": "estudiantes",
    "origen": "frontend"
  },
  "estado_borrador": "BORRADOR",
  "clave_cliente": "draft-estudiante-frontend-uuid"
}
```

Estados permitidos:

- `BORRADOR`
- `LISTO`
- `PUBLICADO`
- `DESCARTADO`

Operaciones permitidas:

- `create`
- `update`
- `upsert`

Regla de calidad: el frontend debe guardar datos incompletos en `registro-borrador`, no en las tablas finales. Las tablas finales siguen protegidas por constraints y reglas de negocio.

## 2. Archivos independientes

El archivo ahora está separado de la transacción.

### Archivo maestro

Base URL:

```http
/api/contabilidad/archivo
```

CRUD:

```http
GET    /api/contabilidad/archivo
GET    /api/contabilidad/archivo/:id_archivo
POST   /api/contabilidad/archivo
PATCH  /api/contabilidad/archivo/:id_archivo
```

Payload mínimo:

```json
{
  "url_archivo": "https://storage.example.com/documento.pdf",
  "nombre_archivo": "recibo.pdf",
  "tipo_mime": "application/pdf",
  "tamano_bytes": 125000,
  "metadata_json": {
    "origen": "frontend"
  }
}
```

También existe endpoint transaccional recomendado:

```http
POST /api/contabilidad/archivo/registrar
```

Este endpoint valida `url_archivo`/`link_archivo` y crea el archivo maestro.

## 3. Asociación archivo-transacción

Base URL:

```http
/api/contabilidad/archivo-transaccion
```

CRUD:

```http
GET    /api/contabilidad/archivo-transaccion
GET    /api/contabilidad/archivo-transaccion/:id_archivo_transaccion
POST   /api/contabilidad/archivo-transaccion
PATCH  /api/contabilidad/archivo-transaccion/:id_archivo_transaccion
```

Para asociar un archivo ya existente:

```json
{
  "id_archivo": 10,
  "id_transaccion": 50,
  "tipo_asociacion": "SOPORTE"
}
```

## 4. Crear archivo y asociación en una sola operación

Endpoint recomendado:

```http
POST /api/contabilidad/archivo-transaccion/registrar
```

Crear archivo nuevo y asociarlo a una transacción:

```json
{
  "id_transaccion": 50,
  "tipo_asociacion": "SOPORTE",
  "observacion": "Recibo adjunto",
  "archivo": {
    "url_archivo": "https://storage.example.com/recibo.pdf",
    "nombre_archivo": "recibo.pdf",
    "tipo_mime": "application/pdf",
    "tamano_bytes": 125000
  }
}
```

Asociar archivo existente a una transacción:

```json
{
  "id_transaccion": 50,
  "id_archivo": 10,
  "tipo_asociacion": "SOPORTE"
}
```

Respuesta:

```json
{
  "success": true,
  "message": "Archivo y asociación a transacción creados correctamente.",
  "data": {
    "archivo": {},
    "archivoTransaccion": {}
  }
}
```

## 5. Recurso legado

El endpoint antiguo sigue existiendo para compatibilidad:

```http
/api/contabilidad/archivos-transaccion
```

Sin embargo, para nueva implementación del frontend debe usarse:

```http
/api/contabilidad/archivo
/api/contabilidad/archivo-transaccion
/api/contabilidad/archivo-transaccion/registrar
```
