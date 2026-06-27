# Cambios aplicados: Redis

## Archivos principales modificados

- `package.json`: agrega `ioredis`.
- `.env.example`: agrega variables Redis y documenta fallback.
- `render.yaml`: declara variables Redis para Render.
- `src/app.module.ts`: reemplaza el guard global en memoria por `RedisRateLimitGuard`.
- `src/common/common.module.ts`: registra y exporta `RedisService`.
- `src/common/services/opaque-session.service.ts`: agrega cache corto de sesiones opacas.
- `src/modules/health/health.controller.ts`: reporta estado de Redis en `/health`.
- `src/modules/health/health.module.ts`: importa `CommonModule` para usar `RedisService`.

## Archivos nuevos

- `src/common/services/redis.service.ts`
- `src/common/guards/redis-rate-limit.guard.ts`
- `docs/redis/REDIS_SETUP.md`

## Comandos recomendados

```bash
yarn install
yarn build
yarn test:smoke:all
```

## Producción Render

Configura `REDIS_URL` como secret env var. Si queda vacío, el backend sigue funcionando con fallback local.
