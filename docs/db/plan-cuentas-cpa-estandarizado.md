# Plan de cuentas CPA estandarizado

Este backend ya no deja activo el plan de cuentas ultradetallado de cientos de cuentas. La migración:

```txt
docs/db/migrations/010_seed_plan_cuentas_cpa_estandarizado.sql
```

normaliza el plan activo tomando como referencia el archivo `ESTADOS FINANCIEROS.xlsx` entregado por el usuario.

## Criterio aplicado

Se mantuvieron las cuentas que aparecen en la operación real del centro:

- Caja moneda nacional.
- Caja moneda extranjera.
- Banco Económico.
- Cuentas por cobrar.
- Edificio.
- Mesas, sillas, pizarras, estantes, puertas/mamparas.
- Equipo de oficina y computación.
- Depreciaciones acumuladas.
- Cuentas por pagar.
- Provisión para aguinaldo.
- Préstamo Banco Económico.
- Capital de propietaria.
- Resultados acumulados y resultado de gestión.
- Ingresos por clases, becas, paquetes y nivelación.
- Intereses ganados y otros ingresos.
- Honorarios, sueldos, materiales, fotocopias, limpieza, refrigerio, luz, internet, transporte, mantenimiento, intereses, diferencia de cambio, donaciones y gastos varios.

Además se conservaron las cuentas mínimas que el backend necesita para operar correctamente:

- `1.1.01.013` Cobros QR y pagos móviles.
- `1.1.02.01.001` Cuentas por cobrar estudiantes y clientes.
- `1.1.02.02.001` Otras cuentas por cobrar.
- `2.1.06.001` Paquetes cobrados por anticipado.
- Grupos `1.1.02`, `1.1.02.01`, `1.1.02.02`, `2.1.03` y `2.1.06`, necesarios para cuentas automáticas por estudiante y tutor.

Desde la migración `011`, las cuentas y grupos fiscales quedan inactivos para el flujo automático de parte de clases pasadas.

## Resultado esperado

Las cuentas antiguas del seed masivo quedan en `Inactivo`. Las cuentas operativas reales quedan en `Activo`.

Además, los recursos CRUD de `cuenta`, `grupo_cuenta`, `centro_costo`, `concepto_costo` y `configuracion_cuenta_operativa` ahora tienen filtro por defecto `estado_registro=Activo`, para que el frontend no vuelva a listar el seed masivo inactivo.


Se mantienen activas las cuentas personalizadas que el sistema genera automáticamente:

```txt
1.1.02.01.E<id_estudiante>  CxC estudiante nueva
1.1.03.E<id_estudiante>     CxC estudiante histórica, si ya existía antes del patch
2.1.06.E<id_estudiante>     Paquete/ingreso diferido estudiante
2.1.03.T<id_tutor>          CxP tutor
```

## Render

Para aplicar esto en Render sin romper checksums de migraciones anteriores:

```bash
yarn db:migrate:prod
```

Para una base limpia:

```bash
yarn db:migrate:prod:fresh
```

## Seguridad incluida

La misma migración refuerza permisos críticos:

- Solo administradores reciben permisos de gestión de seguridad.
- Contadores no reciben permisos para modificar roles/permisos.
- La función `seguridad.api_set_permisos_rol` impide que un administrador se quite a sí mismo permisos críticos del rol que está usando.

## Patch 011

La migración `docs/db/migrations/011_patch_venta_clase_sin_fiscal_apertura_lifecycle.sql` agrega:

- Grupos exigibles `1.1.02`, `1.1.02.01`, `1.1.02.02`.
- Inactivación de cuentas fiscales.
- Balance de apertura `BALANCE_APERTURA_MAY26`.
