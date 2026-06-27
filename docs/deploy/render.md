# Deploy en Render

## Build Command

```bash
bash scripts/render-build.sh
```

## Start Command

```bash
node scripts/render-start.js
```

## Por qué no usar `node dist/main.js` directamente

Dependiendo de la configuración de TypeScript/Nest, el archivo de entrada compilado puede quedar en:

- `dist/main.js`
- `dist/src/main.js`

El script `scripts/render-start.js` detecta automáticamente cualquiera de esas dos rutas y arranca la aplicación desde la que exista.

## Variables mínimas recomendadas

Configura en Render las variables de conexión a PostgreSQL que use tu backend, por ejemplo:

```env
NODE_ENV=production
AUTH_REQUIRED=true
ENABLE_PUBLIC_SIGNUP=false
DATABASE_URL=<connection string de PostgreSQL>
```

Si tu proyecto usa variables separadas, configura también:

```env
DB_HOST=
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
```


## Redis opcional

Configura `REDIS_URL` como variable secreta del servicio web si quieres activar rate limit distribuido y cache de sesiones. Si no se configura, el backend continúa funcionando con fallback local.

Variables recomendadas:

```env
REDIS_URL=redis://usuario:password@host:puerto
REDIS_KEY_PREFIX=cpa:backend
SESSION_CACHE_TTL_SECONDS=300
```
