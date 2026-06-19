# Flujos principales

## Login

1. Cliente llama `POST /api/auth/publicAuth/login`.
2. El backend valida email y contraseña.
3. Se crea una fila en `seguridad.sesion`.
4. Se genera un token opaco.
5. El hash del token se guarda en `metadata.sessionTokenHash`.
6. El token se devuelve en cookie HttpOnly y también en `sessionToken` para facilitar pruebas Postman.

## CRUD protegido

1. Cliente envía cookie `cpa_session` o header `X-Session-Token`.
2. `OpaqueSessionGuard` valida la sesión en PostgreSQL.
3. `PermissionGuard` valida permisos cuando la ruta heredada tenía permiso definido.
4. `CrudService` localiza el recurso en `resource-registry.ts`.
5. `CrudRepository` consulta columnas reales de PostgreSQL y ejecuta SQL parametrizado.
