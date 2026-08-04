# Guía local rápida: instalación, smoke tests y puerto ocupado

Este documento corrige los errores más comunes al correr el backend CPA localmente.

## 1. Instalar dependencias siempre después de descargar un ZIP nuevo

Si aparece:

```txt
Cannot find module 'xlsx' or its corresponding type declarations
```

significa que el código ya referencia la dependencia `xlsx`, pero tu `node_modules` todavía no la tiene instalada.

Ejecuta:

```bash
yarn install
```

Luego vuelve a correr:

```bash
yarn test:smoke:all
```

## 2. Scripts correctos para levantar el backend

Puedes usar cualquiera de estos:

```bash
yarn dev
```

```bash
yarn start:dev
```

```bash
yarn serve
```

`yarn run dev` ahora existe como alias de `nest start --watch`.

## 3. Error EADDRINUSE en puerto 3000

Si aparece:

```txt
Error: listen EADDRINUSE: address already in use :::3000
```

significa que ya hay otro proceso usando el puerto 3000. Puede ser otro backend Nest, Vite, Node, Docker o una terminal anterior que quedó abierta.

### En PowerShell, identifica el proceso

```powershell
netstat -ano | findstr :3000
```

Verás algo como:

```txt
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
```

El último número es el PID. Mata el proceso:

```powershell
taskkill /PID 12345 /F
```

Luego levanta de nuevo:

```powershell
yarn dev
```

## 4. Alternativa: correr backend en otro puerto

En PowerShell:

```powershell
$env:PORT=3001; yarn dev
```

Luego tu backend queda en:

```txt
http://localhost:3001
```

## 5. Orden recomendado local

Para probar desde cero:

```bash
yarn install
yarn db:migrate:prod:fresh
yarn test:smoke:all
```

Para levantarlo manualmente:

```bash
yarn dev
```

## 6. No necesitas levantar servidor para smoke local

Los tests Jest normalmente levantan la app internamente. Por eso, para correr:

```bash
yarn test:smoke:all
```

no necesitas ejecutar antes:

```bash
yarn nest start
```

Solo necesitas que PostgreSQL esté accesible y que las variables `.env` apunten a la base correcta.

## 7. Smoke con `health` en 503 y el resto en verde

Si `yarn test:smoke:all` falla solo en:

```txt
✕ valida health público
Expected: 200
Received: 503
```

el problema no es la base ni los seeds: `/api/health` también comprueba Redis, y `REDIS_URL`
apunta a un host que tu máquina no resuelve.

```txt
ping: cannot resolve redis: Unknown host
```

`redis` es el nombre del servicio dentro de `docker-compose.yml` y solo existe en la red de
Compose. Los smokes, en cambio, corren en el host. En `.env` la URL debe ser la que ve el host:

```bash
REDIS_URL=redis://localhost:6379
```

El contenedor no se ve afectado: `docker-compose.yml` fija `redis://redis:6379` en su bloque
`environment`, que tiene prioridad sobre el `env_file`.

Comprueba que Redis esté levantado y accesible desde el host:

```bash
docker compose up -d redis
nc -z localhost 6379
```

Si prefieres correr los smokes sin Redis, deja `REDIS_URL` vacío: la aplicación cae a sus
límites en memoria y `health` responde 200.
