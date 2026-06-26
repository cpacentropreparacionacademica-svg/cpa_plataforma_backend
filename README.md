# CPA Plataforma Backend - NestJS

Backend migrado desde Express a NestJS siguiendo el prompt del proyecto.

## Cambios principales

- Reemplazo de `app.js`, `server.js`, routers Express y middlewares manuales por NestJS.
- TypeScript como lenguaje principal.
- TypeORM como conexión a PostgreSQL.
- Sesiones opacas persistidas en PostgreSQL, sin JWT.
- Sistema privado: no hay alta pública habilitada por defecto.
- Usuario inicial/demo creado por seed interno de base de datos.
- Seed demo parametrizado desde `.env`.
- Limpieza segura de registros demo antes del seed.
- Rate limiter en memoria, sin Redis.
- Validación con `class-validator` / `class-transformer`.
- 56 recursos CRUD registrados en `src/modules/resource-registry.ts`.
- Smoke test E2E que hace login real y recorre todos los endpoints CRUD registrados.
- Documentación de endpoints en `docs/endpoints/endpoints.md`.
- Colección Postman en `docs/postman`.

## Instalación

```bash
npm install
cp .env.example .env
npm run db:seed:demo
npm run start:dev
```

`npm run db:seed:demo` primero limpia registros demo/basura controlados y luego crea el usuario oficial de prueba.

## Configuración del usuario demo

En `.env` puedes dejar las variables estándar:

```env
TEST_USER_ID=900001
TEST_USER_EMAIL=admin.demo@cpa.test
TEST_USER_USERNAME=admin.demo
TEST_USER_PASSWORD=DemoAdmin123!
```

También se aceptan los alias del enunciado:

```env
Email=admin.demo@cpa.test
Usuario=admin.demo
Password=DemoAdmin123!
```

El sistema es privado por defecto:

```env
AUTH_REQUIRED=true
ENABLE_PUBLIC_SIGNUP=false
```

## Scripts

```bash
npm run start:dev
npm run build
npm run start:prod
npm run type-check
npm run test:smoke
npm run db:clean:demo
npm run db:seed:demo
```

## Smoke test funcional

El smoke test actual es E2E. Hace lo siguiente:

1. carga `.env`;
2. ejecuta el seed del usuario demo;
3. levanta la aplicación Nest en memoria;
4. prueba `GET /api/health`;
5. valida que `signup` público esté bloqueado;
6. hace login con el admin demo;
7. toma `data.sessionToken`;
8. prueba endpoints privados de auth;
9. recorre los 56 recursos CRUD con:
   - `GET /api/<modulo>/<recurso>`;
   - `GET /api/<modulo>/<recurso>/:id`;
   - `POST /api/<modulo>/<recurso>`;
   - `PUT /api/<modulo>/<recurso>/:id`;
   - `PATCH /api/<modulo>/<recurso>/:id`;
10. cierra sesión.

Ejecuta:

```bash
npm run test:smoke
```

El test no intenta fabricar datos completos para cada tabla, porque muchas tablas tienen FKs y reglas de negocio. Para `POST`, `PUT` y `PATCH` valida que la ruta exista, que use sesión real y que no responda `401`, `403`, `429`, `500` ni `Cannot ...`. Es correcto que algunas operaciones respondan `400` por payload vacío o `404` por ID ficticio.

## Limpieza demo segura

La limpieza no borra datos reales del sistema. Solo apunta a registros claramente de prueba:

- rango `TEST_USER_CLEAN_ID_FROM` a `TEST_USER_CLEAN_ID_TO`, por defecto `900001` a `900099`;
- email del test user;
- dominio del email del test user, por defecto `@cpa.test`;
- usuarios `admin.demo`, `demo`, `test`, `usuario.demo` y el usuario definido en `.env`;
- tipos de usuario `ADMIN_DEMO`, `DEMO`, `TEST`.

También elimina sesiones, tokens, roles y permisos relacionados antes de insertar el usuario demo.

## Prueba rápida manual

```bash
curl http://localhost:3000/api/health
```

Login:

```http
POST /api/auth/publicAuth/login
Content-Type: application/json

{
  "email": "admin.demo@cpa.test",
  "password": "DemoAdmin123!"
}
```

Luego usa:

```http
X-Session-Token: <data.sessionToken>
```

## Producción

Para producción cambia la contraseña demo o elimina ese usuario y deja:

```env
AUTH_REQUIRED=true
ENABLE_PUBLIC_SIGNUP=false
SESSION_COOKIE_SECURE=true
```

## Rutas importantes

- Health: `GET /api/health`
- Swagger: `/docs/api`
- Login: `POST /api/auth/publicAuth/login`
- Me: `GET /api/auth/privateAuth/me`
- Endpoints CRUD: ver `docs/endpoints/endpoints.md`.


## Smoke test E2E

El smoke test levanta la aplicación NestJS en memoria, ejecuta el seed del usuario demo, inicia sesión y recorre todos los endpoints CRUD registrados en `src/modules/resource-registry.ts`.

Por defecto usa modo seguro:

```env
SMOKE_DRY_RUN_CRUD_WRITES=true
```

Con ese valor, los endpoints `POST`, `PUT` y `PATCH` se alcanzan y validan autenticación/ruta/guardias, pero no escriben registros de prueba en la base de datos. Esto evita contaminar la base con registros basura.

Para correrlo:

```bash
yarn install
yarn test:smoke
```

Si necesitas ver una tabla final de resultados:

```bash
yarn test:smoke:summary
```

El usuario de prueba se toma desde `.env`:

```env
TEST_USER_EMAIL=admin.demo@cpa.test
TEST_USER_USERNAME=admin.demo
TEST_USER_PASSWORD=DemoAdmin123!
```

Los errores esperables de PostgreSQL como `NOT NULL`, `FOREIGN KEY`, `UNIQUE` o formatos inválidos se convierten en `400` o `409`, no en `500`. Un `500` en el smoke test sigue siendo falla real del backend.

## Endpoints agregados: batch y contabilidad avanzada

Esta versión agrega soporte para operaciones batch y asientos contables compuestos.

### Batch genérico

Todos los módulos CRUD ahora aceptan:

```http
POST /api/{modulo}/{recurso}/batch
PATCH /api/{modulo}/{recurso}/batch
PUT /api/{modulo}/{recurso}/batch
```

Formato recomendado:

```json
{
  "items": [
    { "campo": "valor" },
    { "campo": "otro valor" }
  ]
}
```

Para actualizar:

```json
{
  "items": [
    {
      "ids": { "id_departamento": 1 },
      "data": { "descripcion": "Actualizado" }
    }
  ]
}
```

### Transacción con movimientos en batch

```http
POST /api/contabilidad/transaccion/con-movimientos
```

Permite crear una transacción contable y todos sus movimientos en una sola operación atómica.

### Revertir asiento

```http
POST /api/contabilidad/transaccion/{id_transaccion}/revert
```

Crea un nuevo asiento reverso con todos los movimientos invertidos: debe pasa a haber y haber pasa a debe.

Más detalle en:

```txt
docs/endpoints/batch-y-contabilidad.md
```

## Producción: migración inicial, plan de cuentas y usuarios internos

Para levantar una base PostgreSQL limpia en producción, configura `.env` con las credenciales de conexión y ejecuta:

```bash
yarn db:migrate:prod
```

Esto aplica las migraciones de `docs/db/migrations/` y registra el historial en `public.schema_migrations`.

Incluye:

1. creación del esquema completo de base de datos;
2. plan de cuentas fundamental para operación educativa privada;
3. usuarios iniciales internos:

```txt
Administrador:
Email: pablo.arauz@cpa.test
Usuario: pablo.admin
Password: PabloAdmin2026!

Contador:
Email: maria.sonia.caballero@cpa.test
Usuario: maria.contador
Password: MariaContador2026!
```

Más detalle en:

```txt
docs/db/production-bootstrap.md
```

En producción real, cambia estas contraseñas después del primer acceso.


## Migración productiva fresca

Para reconstruir una base existente desde cero, primero borrando tablas/schemas del sistema CPA y luego aplicando migraciones:

```bash
yarn db:migrate:prod:fresh
```

El reset destructivo usa `DROP TABLE IF EXISTS ... CASCADE` y después `DROP SCHEMA IF EXISTS ... CASCADE` para evitar errores por tipos ENUM, funciones o secuencias ya existentes.

No uses este comando si necesitas conservar datos reales.


## Seeds productivos ampliados

Este paquete incluye seeds productivos generados desde los JSON entregados:

- `docs/db/seed-source/plan_cuentas_ultradetallado_bolivia_servicios_educativos_tienda.json`
- `docs/db/seed-source/seed_rbac_roles_permisos_entidades_base_cpa.json`

Comando recomendado para base limpia:

```bash
yarn db:migrate:prod:fresh
```

Credenciales iniciales:

```txt
Pablo Arauz Caballero
Usuario: pablo.admin
Email: pablo.arauz@cpa.test
Password: PabloAdmin2026!

Maria Sonia Caballero
Usuario: maria.contador
Email: maria.sonia.caballero@cpa.test
Password: MariaContador2026!
```

## Frontend - Parte de clases pasadas

Para integrar la tabla editable del formulario físico **PARTE DE CLASES PASADAS**, revisar:

```txt
docs/endpoints/venta-clase-frontend-contract.md
```

Endpoint principal:

```http
POST /api/contabilidad/venta-clase/registrar-batch
```

## Patch contable: cuentas operativas y cuentas por estudiante/tutor

Ver contrato frontend en:

```txt
docs/endpoints/cuentas-operativas-persona.md
```

Este patch agrega:

- `contabilidad.configuracion_cuenta_operativa`
- creación automática de CxC y paquete diferido al crear estudiante
- creación automática de CxP al crear tutor
- resolución automática de cuentas por estudiante en `POST /api/contabilidad/venta-clase/registrar-batch`

## Seed académico Santa Cruz

Se agregó `docs/db/migrations/007_seed_catalogos_academicos_scz.sql` para cargar materias, temas, subtemas, unidades educativas principales de Santa Cruz y productos educativos base. Ver `docs/db/seed-catalogos-academicos-scz.md`.
