# Auth session: permisos reales en respuesta de sesión

El backend devuelve permisos reales en la respuesta de sesión para que el frontend no use matrices simuladas.

## Endpoints

```http
POST /api/auth/publicAuth/login
GET  /api/auth/privateAuth/me
POST /api/auth/privateAuth/me
POST /api/auth/privateAuth/refresh-session
POST /api/auth/privateAuth/refreshSession
```

## Campos relevantes

```json
{
  "success": true,
  "data": {
    "user": {},
    "sessionToken": "opaque-token",
    "tokenType": "Opaque",
    "roles": [],
    "roles_usuario": [],
    "permissions": [],
    "permisos": [],
    "permissionCodes": [],
    "codigosPermiso": []
  }
}
```

`permissions` y `permisos` son alias del mismo arreglo. `permissionCodes` y `codigosPermiso` son alias de códigos planos para validaciones rápidas en frontend.

Cada permiso incluye:

```json
{
  "id_permiso": "1",
  "idPermiso": "1",
  "codigo": "SISTEMA.PERMISOS.VER",
  "codigoPermiso": "SISTEMA.PERMISOS.VER",
  "descripcion": "Ver permisos",
  "modulo": "SISTEMA",
  "fuente": "ROL"
}
```

Para super usuarios, el backend devuelve todos los permisos activos con fuente `SUPER_USUARIO`.
