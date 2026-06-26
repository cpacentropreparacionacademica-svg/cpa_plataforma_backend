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
