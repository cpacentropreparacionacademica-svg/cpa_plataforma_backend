# API Gateway interno

El proyecto queda listo para correr detrás de un gateway externo o con gateway interno NestJS. En esta versión el gateway interno se implementa mediante:

- Prefijo global `/api`.
- CORS centralizado.
- Rate limiter global sin Redis.
- Guard de sesión opaca.
- Guard de permisos por recurso.
- Swagger en `/docs/api`.

Si en producción se usa Nginx, Kong, Traefik o API Gateway administrado, debe conservarse la misma política de rate limit y cabeceras.
