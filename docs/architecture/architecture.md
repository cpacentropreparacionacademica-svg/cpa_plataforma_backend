# Arquitectura NestJS aplicada

## Decisión principal

El código Express fue reemplazado por una arquitectura NestJS con TypeScript.

## Reglas aplicadas del prompt del proyecto

- No Express puro.
- No Redis.
- No JWT.
- No Sequelize.
- No Zod.
- Persistencia con PostgreSQL y TypeORM.
- Validación con `class-validator` y `class-transformer` en DTOs concretos.
- Sesiones opacas persistidas en PostgreSQL.
- Rate limiter sin Redis.
- API Gateway interno mediante guards, prefijo global y configuración centralizada.

## Estructura

```txt
src/
  main.ts
  app.module.ts
  api-gateway/
  common/
  database/
  modules/
```

## Recursos migrados

Se migraron 56 recursos CRUD conservando las rutas originales de Express.
