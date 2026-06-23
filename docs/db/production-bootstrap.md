# Bootstrap de producción CPA Plataforma

Este backend incluye seeds productivos para:

1. **Contabilidad** desde `plan_cuentas_ultradetallado_bolivia_servicios_educativos_tienda.json`.
   - 89 grupos de cuenta.
   - 727 cuentas contables.
   - 16 centros de costo.
   - 12 conceptos de costo.

2. **Seguridad/RBAC y entidades base** desde `seed_rbac_roles_permisos_entidades_base_cpa.json`.
   - 17 roles, incluyendo alias `CONTADOR`.
   - 489 permisos consolidados entre RBAC funcional y compatibilidad NestJS.
   - Usuarios productivos iniciales Pablo y Maria.
   - Sucursales, edificios, espacios, tienda, departamentos, posiciones, KPI, unidades educativas, proveedores y clases de título base.

## Ejecutar desde cero

```bash
yarn db:migrate:prod:fresh
```

## Ejecutar sin borrar datos

```bash
yarn db:migrate:prod
```

## Usuarios iniciales

### Pablo Arauz Caballero

- Usuario: `pablo.admin`
- Email: `pablo.arauz@cpa.test`
- Password temporal: `PabloAdmin2026!`
- Roles: `SUPER_ADMIN`, `ADMIN_GENERAL`
- Super usuario: `true`

### Maria Sonia Caballero

- Usuario: `maria.contador`
- Email: `maria.sonia.caballero@cpa.test`
- Password temporal: `MariaContador2026!`
- Roles: `CONTADOR_GENERAL`, `CONTADOR`
- Super usuario: `false`

> Cambia estas contraseñas después del primer ingreso. El backend actual valida contraseñas con SHA-256, por eso el seed almacena hashes SHA-256 precomputados.
