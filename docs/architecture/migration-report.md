# Reporte de migración Express → NestJS

## Qué se corrigió

- Se eliminó la dependencia de `app.js`, `server.js`, `express.Router()` y middlewares Express manuales.
- Se creó arranque NestJS en `src/main.ts`.
- Se creó módulo raíz en `src/app.module.ts`.
- Se separaron módulos funcionales en `src/modules/*`.
- Se reemplazó JWT por sesiones opacas persistidas en PostgreSQL.
- Se eliminó Redis del diseño de ejecución.
- Se reemplazó Sequelize por TypeORM como conexión a PostgreSQL.
- Se eliminó Zod de dependencias y se usó `class-validator` / `class-transformer` en DTOs de Auth.
- Se conservó el contrato de rutas CRUD original mediante `resource-registry.ts`.
- Se agregó rate limiter sin Redis.
- Se agregó Swagger en `/docs/api`.
- Se agregó colección Postman actualizada.
- Se agregó smoke test básico de configuración de rutas.

## Rutas conservadas

La base sigue siendo `/api/{modulo}/{recurso}`. Ejemplo:

```txt
GET  /api/administracion/departamento
POST /api/administracion/departamento
GET  /api/administracion/departamento/:id_departamento
PUT  /api/administracion/departamento/:id_departamento
```

Para recursos con clave primaria compuesta:

```txt
GET /api/seguridad/rol-permiso/:id_rol/:id_permiso
PUT /api/seguridad/rol-permiso/:id_rol/:id_permiso
```

## Nota de ejecución local

En `.env.example` se dejó `AUTH_REQUIRED=false` para que puedas probar los CRUD en Postman sin tener primero usuarios/sesiones configurados. Para producción debe cambiarse a `AUTH_REQUIRED=true`.
