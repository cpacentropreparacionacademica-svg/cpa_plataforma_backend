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
