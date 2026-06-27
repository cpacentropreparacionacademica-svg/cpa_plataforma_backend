# Redis en CPA Plataforma Backend

## Objetivo

Redis se usa de forma opcional y segura para dos responsabilidades concretas:

1. **Rate limit distribuido**: evita que el límite de solicitudes dependa de la memoria de una sola instancia Node.
2. **Cache corto de sesiones opacas**: reduce lecturas repetitivas a PostgreSQL durante requests autenticados.

La sesión sigue guardándose en PostgreSQL (`seguridad.sesion`). Redis no reemplaza la fuente de verdad.

## Variables de entorno

```env
REDIS_URL=redis://usuario:password@host:puerto
REDIS_KEY_PREFIX=cpa:backend
REDIS_CONNECT_TIMEOUT_MS=2000
SESSION_CACHE_TTL_SECONDS=300
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Comportamiento sin Redis

Si `REDIS_URL` está vacío:

- El backend arranca normalmente.
- El rate limit usa fallback local en memoria.
- Las sesiones se validan directamente contra PostgreSQL.
- `/health` mostrará Redis como `enabled: false`.

## Comportamiento con Redis

Si `REDIS_URL` está configurado:

- El rate limit usa contadores Redis con TTL.
- La validación de sesión consulta Redis antes de PostgreSQL.
- Al cerrar sesión, el cache de esa sesión se elimina.
- Si Redis falla temporalmente, el backend continúa usando PostgreSQL y fallback en memoria para no tumbar producción.

## Render

En Render configura `REDIS_URL` como variable secreta del servicio web.

El archivo `render.yaml` ya declara:

```yaml
- key: REDIS_URL
  sync: false
- key: REDIS_KEY_PREFIX
  value: cpa:backend
- key: SESSION_CACHE_TTL_SECONDS
  value: "300"
```

## Validación rápida

```bash
yarn build
yarn test:smoke:all
```

Luego revisa:

```txt
GET /health
```

Debe responder `dependencies.redis.enabled=true` y `dependencies.redis.ok=true` si `REDIS_URL` está bien configurado.
