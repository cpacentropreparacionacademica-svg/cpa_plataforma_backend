# CPA Plataforma Backend NestJS

Backend privado para CPA Plataforma.

## Documento principal para el frontend

Pasar este archivo al equipo/frontend:

```txt
docs/frontend/FRONTEND_CONTRATO_CPA_ULTRA_DETALLADO.md
```

Resumen rápido:

- Login acepta usuario o email real.
- Usuarios base: `pablo.admin`, `maria.contador`, `katia.admin`.
- El endpoint correcto de aulas es `/api/infraestructura/aula`.
- La venta de clases pasadas se registra con `/api/contabilidad/venta-clase/registrar-batch`.
- Efectivo y QR se resuelven con configuración contable desde base de datos.
- CxC y paquete se resuelven por cuentas asociadas al estudiante.
- Al crear estudiante/tutor, el backend provisiona cuentas contables asociadas.

## Migraciones

Producción en blanco:

```bash
yarn db:migrate:prod:fresh
```

Producción con datos:

```bash
yarn db:migrate:prod
```

No usar `fresh` cuando ya existan datos reales.

## Documentación relevante

```txt
docs/frontend/README_PASAR_AL_FRONTEND.md
docs/frontend/FRONTEND_CONTRATO_CPA_ULTRA_DETALLADO.md
docs/project/DOCUMENTACION_GENERAL_ULTRA_DETALLADA.md
docs/endpoints/endpoints.md
docs/endpoints/venta-clase-frontend-contract.md
docs/endpoints/cuentas-operativas-persona.md
docs/db/production-bootstrap.md
```


## Smoke test FULL antes de producción

Para validar el backend completo antes de desplegar o después de un reset productivo en blanco:

```bash
yarn db:migrate:prod:fresh
yarn test:smoke:all
```

Para probar un backend ya desplegado:

```bash
SMOKE_BASE_URL=https://TU_BACKEND_RENDER.onrender.com SMOKE_LOGIN=pablo.admin@cpa.com SMOKE_PASSWORD=PabloAdmin2026! yarn smoke:live
```

Documento detallado: `docs/testing/SMOKE_FULL_CONTRATO_10.md`.

Documento que debes pasar al frontend: `docs/frontend/FRONTEND_CONTRATO_CPA_ULTRA_DETALLADO.md`.

## QA avanzado: importaciones, errores de negocio y backup

Smoke completo:

```bash
yarn db:migrate:prod:fresh
yarn test:smoke:all
```

Smoke específico de importaciones y errores de negocio:

```bash
yarn test:smoke:imports-business
```

Backup PostgreSQL manual:

```bash
yarn backup:postgres
```

Documento detallado:

```txt
docs/testing/SMOKE_IMPORTS_BUSINESS_BACKUP.md
```


## Backup programado Render -> Neon backup

El proyecto incluye `scripts/backup-postgres.js` y un cron en `render.yaml`.

El link/conexión del otro proyecto Neon se configura en `.env.example` y en Render como variable de entorno:

```env
BACKUP_TARGET_DATABASE_URL=postgresql://usuario:password@host-backup.neon.tech/neondb?sslmode=require
BACKUP_RESTORE_TO_TARGET=true
BACKUP_TARGET_CONFIRM=I_UNDERSTAND_TARGET_WILL_BE_REPLACED
```

`DATABASE_URL` es la base principal. `BACKUP_TARGET_DATABASE_URL` es la base destino de respaldo. Deben ser distintas.

Para ejecutar manualmente:

```bash
yarn backup:postgres
```

## Redis opcional para producción

El backend ahora soporta Redis opcional para rate limit distribuido y cache corto de sesiones opacas.

```env
REDIS_URL=redis://usuario:password@host:puerto
REDIS_KEY_PREFIX=cpa:backend
SESSION_CACHE_TTL_SECONDS=300
```

Si `REDIS_URL` no está configurado, el sistema sigue funcionando con PostgreSQL como fuente de verdad y fallback local en memoria para rate limit.

Documento detallado: `docs/redis/REDIS_SETUP.md`.
