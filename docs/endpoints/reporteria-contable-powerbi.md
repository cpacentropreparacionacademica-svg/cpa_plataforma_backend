# Conciliación Backend ↔ Frontend — Reportería Contable CPA

Este documento fija el contrato mínimo para conectar el frontend de reportería contable con un endpoint especializado que consulta directamente la view PostgreSQL:

```sql
contabilidad.v_powerbi_contable_movimiento
```

La regla principal es simple: **el frontend no consume CRUD, no consulta módulos administrativos y no construye reportes con múltiples endpoints**. Todo debe venir de un único endpoint de lectura.

---

## 1. Endpoint único requerido

```http
GET /api/reporteria/contabilidad/powerbi-movimientos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&fechaCorte=YYYY-MM-DD
```

El frontend también envía el alias `fecha_corte` con el mismo valor para facilitar compatibilidad `camelCase` / `snake_case`.

### Query params

| Parámetro | Obligatorio | Uso |
|---|---:|---|
| `desde` | Sí | Inicio del periodo para Libro Diario, Libro Mayor, Estado de Resultados y Flujo de Caja. |
| `hasta` | Sí | Fin del periodo para Libro Diario, Libro Mayor, Estado de Resultados y Flujo de Caja. |
| `fechaCorte` | Sí | Fecha de corte para Balance General y saldos acumulados. |
| `fecha_corte` | No | Alias equivalente de `fechaCorte`. |

### Validaciones mínimas backend

- Las tres fechas deben tener formato `YYYY-MM-DD`.
- `desde <= hasta`.
- `fechaCorte` debería ser `>= hasta` en operación normal. Si no lo es, el backend debe decidir si rechaza con `400` o si usa `hasta` como corte. Recomendación: rechazar con mensaje claro.
- El endpoint es solo lectura.
- No debe devolver registros inactivos. La view ya filtra activos, pero el endpoint no debe quitar esa garantía.

---

## 2. Por qué el endpoint debe devolver hasta `fechaCorte`

Aunque algunos reportes usan rango `desde/hasta`, el frontend necesita movimientos acumulados para:

1. **Balance General:** debe calcular saldos acumulados hasta la fecha de corte.
2. **Flujo de Caja:** necesita saldos anteriores a `desde` para estimar saldo inicial de efectivo.

Por eso el SQL recomendado no debe limitarse solamente a `desde/hasta`. Debe traer movimientos hasta `fechaCorte`.

```sql
SELECT *
FROM contabilidad.v_powerbi_contable_movimiento
WHERE fecha_transaccion <= :fecha_corte
ORDER BY fecha_transaccion ASC, id_transaccion ASC, id_movimiento ASC;
```

El frontend se encarga de separar localmente:

- movimientos del periodo,
- movimientos acumulados al corte,
- movimientos anteriores al periodo,
- filtros visuales por búsqueda o subtipo contable.

---

## 3. Respuesta oficial esperada

La respuesta oficial es **metadata + movimientos**.

```json
{
  "metadata": {
    "generadoEn": "2026-07-03T18:45:00.000Z",
    "origen": "contabilidad.v_powerbi_contable_movimiento",
    "desde": "2026-07-01",
    "hasta": "2026-07-31",
    "fechaCorte": "2026-07-31",
    "moneda": "BOB",
    "cuentaEfectivo": {
      "idCuenta": 0,
      "codigoCuenta": "COMPLETAR_CODIGO_CUENTA_EFECTIVO",
      "nombreCuenta": "COMPLETAR_NOMBRE_CUENTA_EFECTIVO"
    }
  },
  "movimientos": []
}
```

### Campo crítico: cuenta de efectivo

El flujo de caja depende de la cuenta o cuentas de efectivo. Por eso el endpoint debe devolver esta metadata.

Para una sola cuenta:

```json
{
  "metadata": {
    "cuentaEfectivo": {
      "idCuenta": 1,
      "codigoCuenta": "1110",
      "nombreCuenta": "Caja general"
    }
  }
}
```

Para varias cuentas de efectivo o equivalentes:

```json
{
  "metadata": {
    "cuentasEfectivo": [
      { "idCuenta": 1, "codigoCuenta": "1110", "nombreCuenta": "Caja general" },
      { "idCuenta": 2, "codigoCuenta": "1120", "nombreCuenta": "Banco" }
    ]
  }
}
```

El frontend acepta `camelCase` y `snake_case`:

```json
{
  "metadata": {
    "cuenta_efectivo": {
      "id_cuenta": 1,
      "codigo_cuenta": "1110",
      "nombre_cuenta": "Caja general"
    }
  }
}
```

---

## 4. Movimiento esperado por cada fila

Cada fila de `movimientos` debe salir de la view y respetar estos nombres `snake_case`:

```json
{
  "id_transaccion": 1,
  "id_movimiento": 1,
  "fecha_transaccion": "2026-07-01",
  "periodo_inicio": "2026-07-01",
  "periodo_fin": "2026-07-31",
  "anio": 2026,
  "mes": 7,
  "tipo_transaccion": "INGRESO",
  "sub_tipo_transaccion": "COBRO",
  "glosa": "Cobro de mensualidad",
  "id_cuenta": 1,
  "codigo_cuenta": "1110",
  "nombre_cuenta": "Caja general",
  "id_grupo_cuenta": 1,
  "codigo_grupo_cuenta": "ACT",
  "nombre_grupo_cuenta": "Activo corriente",
  "tipo_reporte": "BALANCE",
  "sub_tipo": "ACTIVO",
  "sub_grupo": "Activo corriente",
  "orden_reporte": 10,
  "debe": "280.00",
  "haber": "0.00",
  "saldo_deudor": "280.00",
  "saldo_natural": "280.00",
  "naturaleza_saldo": "DEUDOR"
}
```

El frontend normaliza números aunque lleguen como string decimal de PostgreSQL.

---

## 5. SQL recomendado para el endpoint

```sql
SELECT
  id_transaccion,
  id_movimiento,
  fecha_transaccion,
  periodo_inicio,
  periodo_fin,
  anio,
  mes,
  tipo_transaccion,
  sub_tipo_transaccion,
  glosa,
  id_cuenta,
  codigo_cuenta,
  nombre_cuenta,
  id_grupo_cuenta,
  codigo_grupo_cuenta,
  nombre_grupo_cuenta,
  tipo_reporte,
  sub_tipo,
  sub_grupo,
  orden_reporte,
  debe,
  haber,
  saldo_deudor,
  saldo_natural,
  naturaleza_saldo
FROM contabilidad.v_powerbi_contable_movimiento
WHERE fecha_transaccion <= $1::date
ORDER BY
  fecha_transaccion ASC,
  id_transaccion ASC,
  id_movimiento ASC;
```

### Nota sobre `desde` y `hasta`

El backend recibe `desde` y `hasta` para devolverlos en metadata y validar el rango. No debe usarlos para cortar la consulta principal si se quiere que balance y flujo de caja cuadren correctamente.

---

## 6. Ejemplo de implementación NestJS orientativa

No es obligatorio copiarlo tal cual, pero este es el contrato que el frontend espera.

```ts
@Get('powerbi-movimientos')
async getPowerBiMovimientos(@Query() query: ReporteriaContableQueryDto) {
  const desde = parseDateParam(query.desde, 'desde');
  const hasta = parseDateParam(query.hasta, 'hasta');
  const fechaCorte = parseDateParam(query.fechaCorte ?? query.fecha_corte, 'fechaCorte');

  if (desde > hasta) {
    throw new BadRequestException('La fecha desde no puede ser mayor que la fecha hasta.');
  }

  if (fechaCorte < hasta) {
    throw new BadRequestException('La fecha de corte debe ser mayor o igual a la fecha hasta.');
  }

  const movimientos = await this.reporteriaContableService.listMovimientosHastaFechaCorte(fechaCorte);

  return {
    metadata: {
      generadoEn: new Date().toISOString(),
      origen: 'contabilidad.v_powerbi_contable_movimiento',
      desde,
      hasta,
      fechaCorte,
      moneda: 'BOB',
      cuentaEfectivo: {
        idCuenta: Number(process.env.REPORTERIA_CUENTA_EFECTIVO_ID),
        codigoCuenta: process.env.REPORTERIA_CUENTA_EFECTIVO_CODIGO,
        nombreCuenta: process.env.REPORTERIA_CUENTA_EFECTIVO_NOMBRE,
      },
    },
    movimientos,
  };
}
```

---

## 7. Variables recomendadas en backend

```env
REPORTERIA_CUENTA_EFECTIVO_ID=COMPLETAR
REPORTERIA_CUENTA_EFECTIVO_CODIGO=COMPLETAR
REPORTERIA_CUENTA_EFECTIVO_NOMBRE=COMPLETAR
```

Si existen varias cuentas:

```env
REPORTERIA_CUENTAS_EFECTIVO_JSON=[{"idCuenta":1,"codigoCuenta":"1110","nombreCuenta":"Caja general"}]
```

---

## 8. Variables frontend

```env
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:3000
VITE_REPORTERIA_CONTABLE_ENDPOINT=/api/reporteria/contabilidad/powerbi-movimientos
VITE_SESSION_TOKEN=
VITE_CASH_ACCOUNT_CODES=
```

`VITE_CASH_ACCOUNT_CODES` queda solo como respaldo temporal. La fuente correcta es `metadata.cuentaEfectivo` o `metadata.cuentasEfectivo`.

---

## 9. Prueba rápida con cURL

```bash
curl "http://localhost:3000/api/reporteria/contabilidad/powerbi-movimientos?desde=2026-07-01&hasta=2026-07-31&fechaCorte=2026-07-31"
```

Con token opcional:

```bash
curl \
  -H "X-Session-Token: TU_TOKEN" \
  "http://localhost:3000/api/reporteria/contabilidad/powerbi-movimientos?desde=2026-07-01&hasta=2026-07-31&fechaCorte=2026-07-31"
```

---

## 10. Checklist de conciliación final

Backend:

- [ ] Existe endpoint único `GET /api/reporteria/contabilidad/powerbi-movimientos`.
- [ ] Consulta únicamente `contabilidad.v_powerbi_contable_movimiento`.
- [ ] No depende de endpoints CRUD.
- [ ] Devuelve movimientos hasta `fechaCorte`.
- [ ] Ordena por `fecha_transaccion`, `id_transaccion`, `id_movimiento`.
- [ ] Devuelve `metadata.origen` con el nombre de la view.
- [ ] Devuelve `metadata.cuentaEfectivo` o `metadata.cuentasEfectivo`.
- [ ] Valida `desde <= hasta`.
- [ ] Valida `fechaCorte >= hasta` o aplica una regla documentada equivalente.
- [ ] Devuelve números compatibles como string decimal o number.

Frontend:

- [ ] `.env` tiene `VITE_USE_MOCKS=false` para producción.
- [ ] `VITE_API_BASE_URL` apunta al backend real.
- [ ] `VITE_REPORTERIA_CONTABLE_ENDPOINT` coincide con el endpoint backend.
- [ ] La pestaña Flujo de Caja muestra fuente `metadata` para cuentas de efectivo.
- [ ] Libro Diario cuadra debe/haber.
- [ ] Balance General muestra diferencia cercana a cero cuando la contabilidad está cuadrada.
- [ ] Estado de Resultados usa solo `INGRESO` y `GASTO`.
- [ ] Flujo de Caja usa la cuenta exacta enviada por metadata.

---

## 11. Decisión pendiente de negocio

Completar la cuenta exacta de efectivo:

```txt
idCuenta:
codigoCuenta:
nombreCuenta:
```

Cuando esto esté definido en backend, el frontend ya no requiere configuración manual para flujo de caja.
