# Seed de permisos para reportería contable

Este seed habilita los permisos que necesita el frontend de reportería para mostrar el panel de **Contabilidad** y sus reportes disponibles según los accesos del usuario.

## Qué crea

Permisos generales:

```txt
REPORTERIA.CONTABILIDAD.READ
REPORTERIA.CONTABILIDAD.*
REPORTERIA.CONTABLE.READ
REPORTERIA.CONTABLE.*
CONTABILIDAD.REPORTERIA.READ
CONTABILIDAD.REPORTES.READ
```

Permisos por reporte:

```txt
REPORTERIA.CONTABILIDAD.LIBRO_DIARIO.READ
REPORTERIA.CONTABILIDAD.DIARIO.READ
REPORTERIA.CONTABILIDAD.LIBRO_MAYOR.READ
REPORTERIA.CONTABILIDAD.MAYOR.READ
REPORTERIA.CONTABILIDAD.ESTADO_RESULTADOS.READ
REPORTERIA.CONTABILIDAD.BALANCE_GENERAL.READ
REPORTERIA.CONTABILIDAD.FLUJO_CAJA.READ
CONTABILIDAD.LIBRO_DIARIO.READ
CONTABILIDAD.LIBRO_MAYOR.READ
CONTABILIDAD.EEFF.READ
CONTABILIDAD.ESTADO_RESULTADOS.READ
CONTABILIDAD.BALANCE_GENERAL.READ
CONTABILIDAD.FLUJO_CAJA.READ
```

Rol nuevo:

```txt
REPORTERIA_CONTABLE
```

## Roles que reciben acceso

```txt
SUPER_ADMIN
ADMIN_GENERAL
CONTADOR_GENERAL
CONTADOR
REPORTERIA_CONTABLE
```

Además, los usuarios con `tipo_usuario` `CONTADOR` o `CONTADOR_GENERAL`, y el usuario `maria.contador`, reciben el rol `REPORTERIA_CONTABLE` como respaldo.

## Cómo ejecutarlo

Opción recomendada en producción:

```bash
yarn db:migrate:prod
```

Opción puntual si la base ya está migrada y solo necesitas reparar permisos:

```bash
yarn db:seed:reporteria-contable
```

## Validación rápida en SQL

```sql
SELECT p.codigo, p.modulo, p.estado_registro
FROM seguridad.permiso p
WHERE p.codigo LIKE 'REPORTERIA.CONTABILIDAD.%'
   OR p.codigo LIKE 'REPORTERIA.CONTABLE.%'
   OR p.codigo IN (
     'CONTABILIDAD.REPORTERIA.READ',
     'CONTABILIDAD.REPORTES.READ',
     'CONTABILIDAD.LIBRO_DIARIO.READ',
     'CONTABILIDAD.LIBRO_MAYOR.READ',
     'CONTABILIDAD.EEFF.READ',
     'CONTABILIDAD.ESTADO_RESULTADOS.READ',
     'CONTABILIDAD.BALANCE_GENERAL.READ',
     'CONTABILIDAD.FLUJO_CAJA.READ'
   )
ORDER BY p.codigo;
```

Validar permisos efectivos de un usuario:

```sql
SELECT p.codigo
FROM seguridad.usuario_rol ur
JOIN seguridad.rol r ON r.id_rol = ur.id_rol
JOIN seguridad.rol_permiso rp ON rp.id_rol = r.id_rol
JOIN seguridad.permiso p ON p.id_permiso = rp.id_permiso
WHERE ur.id_persona = 900002
  AND COALESCE(ur.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
  AND COALESCE(r.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
  AND COALESCE(p.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
ORDER BY p.codigo;
```

## Nota de integración con frontend

Después de iniciar sesión, el backend ya devuelve `permissions`, `permisos`, `permissionCodes` y `codigosPermiso`. El frontend de reportería usa esos códigos para decidir qué tarjetas y pestañas mostrar.
