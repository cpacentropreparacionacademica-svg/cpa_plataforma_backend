# Smoke test FULL - CPA Plataforma Backend

Este documento describe el smoke test fuerte agregado para acercar el backend a un nivel de confiabilidad alto antes de subir a producción.

## Comando principal

```bash
yarn test:smoke:full
```

## Comando recomendado antes de producción

```bash
yarn db:migrate:prod:fresh
yarn test:smoke:all
```

`test:smoke:all` ejecuta:

```bash
yarn test:smoke
yarn test:smoke:full
```

## Qué valida el smoke FULL

1. API levantada.
2. Signup público bloqueado.
3. Login con usuario real `@cpa.com`.
4. Login por `nombre_usuario`.
5. Usuarios reales sin `.test`:
   - `pablo.admin@cpa.com`
   - `maria.contador@cpa.com`
   - `katia.admin@cpa.com`
6. Todas las tablas del `resource-registry` existen físicamente.
7. Todos los endpoints `GET list` existen y devuelven `data` como arreglo.
8. Todos los recursos tienen endpoint batch genérico.
9. Todos los recursos tienen endpoint compatible con frontend:
   - `POST /api/{modulo}/{recurso}/batch/validate`
   - `POST /api/{modulo}/{recurso}/batch/process`
10. Endpoints críticos del frontend:
   - `/api/infraestructura/aula`
   - `/api/infraestructura/espacio`
   - `/api/servicios_educativos/materia-tree`
   - `/api/personas/unidad-educativa`
   - `/api/servicios_educativos/producto-educativo`
   - `/api/contabilidad/configuracion-cuenta-operativa`
   - `/api/contabilidad/cuenta`
   - `/api/contabilidad/venta-clase-registro`
11. Seeds académicos mínimos:
   - mínimo 180 registros de `materia_tree`
   - mínimo 90 unidades educativas
   - mínimo 30 productos educativos
12. Configuración contable operativa:
   - efectivo
   - QR
   - ingreso por clases por hora
13. Creación de estudiante y generación automática de cuentas:
   - `ESTUDIANTE_CXC`
   - `ESTUDIANTE_PAQUETE_DIFERIDO`
14. Creación de tutor y generación automática de cuenta:
   - `TUTOR_CXP`
15. Flujo completo de venta de clase:
   - crea/vincula clase por hora
   - crea transacción tipo `VENTA`
   - crea detalle de venta
   - crea movimientos contables
   - valida que Debe = Haber
   - guarda trazabilidad en `venta_clase_registro`

## Smoke live contra backend desplegado

Para probar Render o producción sin levantar Nest en memoria:

```bash
SMOKE_BASE_URL=https://TU_BACKEND_RENDER.onrender.com \
SMOKE_LOGIN=pablo.admin@cpa.com \
SMOKE_PASSWORD=PabloAdmin2026! \
yarn smoke:live
```

Este script prueba health, login, rutas críticas, batch validate y logout.

## Nota honesta

Este smoke no reemplaza pruebas unitarias, pruebas de seguridad, pruebas de carga ni auditoría contable externa. Pero sí detecta los errores que más te estaban rompiendo:

- endpoint no existente;
- contrato frontend/backend roto;
- `data` con forma incorrecta;
- seed incompleto;
- migración incompleta;
- aulas como recurso faltante;
- cuentas operativas faltantes;
- venta-clase desbalanceada;
- cuentas de estudiante/tutor no generadas.
