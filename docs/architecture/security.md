# Seguridad

- Autenticación: sesiones opacas persistidas en PostgreSQL.
- Alta de usuarios: deshabilitada por defecto en endpoint público; el usuario inicial se crea por seed SQL interno.
- Cookies: HttpOnly, SameSite y Secure configurable por entorno.
- Autorización: permisos heredados desde los routers Express originales.
- Rate limiter: memoria local, sin Redis.
- SQL: consultas parametrizadas y nombres de tabla/columna validados por lista blanca.

Para producción configurar:

```env
AUTH_REQUIRED=true
ENABLE_PUBLIC_SIGNUP=false
SESSION_COOKIE_SECURE=true
SESSION_SAME_SITE=lax
```
