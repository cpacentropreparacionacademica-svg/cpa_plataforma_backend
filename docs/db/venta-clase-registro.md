# Patch 005: venta_clase_registro

Tabla agregada:

```sql
contabilidad.venta_clase_registro
```

Esta tabla guarda la fila original capturada desde el formulario **PARTE DE CLASES PASADAS** y la vincula con:

- `servicios_educativos.clase_por_hora`, cuando se pudo crear o vincular.
- `contabilidad.transaccion`.
- `contabilidad.transaccion_detalle_venta`.
- `contabilidad.transaccion_movimiento_cuenta`, mediante la transacción.

La tabla no reemplaza a `transaccion_detalle_venta`; sirve como trazabilidad operacional del formulario.

## Motivo del diseño

El frontend no debe armar la contabilidad llamando muchos endpoints separados. Debe enviar la fila completa al backend. El backend crea todo en una transacción SQL y garantiza que no queden registros incompletos.

## Migración

```bash
yarn db:migrate:prod
```

En producción vacía o entorno de pruebas:

```bash
yarn db:migrate:prod:fresh
```
