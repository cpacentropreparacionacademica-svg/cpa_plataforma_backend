# Plan de cuentas ampliado CPA Plataforma

Este plan de cuentas se carga desde:

```txt
docs/db/migrations/002_seed_plan_cuentas_fundamental.sql
```

## Objetivo

Crear una base contable operativa para una empresa privada de servicios educativos.

El plan está pensado para registrar operaciones de:

- ingresos por clases, tutorías, cursos, paquetes, matrículas y venta de materiales;
- cuentas por cobrar a estudiantes, padres y empresas convenio;
- pagos a tutores, empleados, proveedores y obligaciones tributarias;
- inventarios educativos, activos fijos, depreciaciones, tecnología e infraestructura;
- reportes de balance general y estado de resultados.

## Estructura

La estructura respeta la clasificación contable general:

```txt
1 Activo
2 Pasivo
3 Patrimonio Neto
4 Ingresos
5 Costos y Gastos
```

En la base de datos se carga con:

- grupos principales;
- subgrupos de segundo nivel;
- subgrupos de tercer nivel;
- cuentas contables finales listas para usarse en movimientos.

## Cobertura principal

### Activo

Incluye disponibilidades, inversiones temporales, cuentas por cobrar, inventarios, impuestos por recuperar, pagos anticipados, activos fijos, depreciación acumulada, intangibles y depósitos en garantía.

### Pasivo

Incluye proveedores, cuentas por pagar, obligaciones laborales, AFP, caja de salud, retenciones, IVA débito fiscal, IT, IUE, RC-IVA, préstamos, tarjetas de crédito, cobros anticipados e ingresos diferidos.

### Patrimonio

Incluye capital social, aportes por capitalizar, reservas, resultados acumulados, utilidad o pérdida del ejercicio y distribución de utilidades.

### Ingresos

Incluye ingresos por clases particulares, tutorías, cursos regulares, cursos intensivos, paquetes educativos, clases por hora, matrículas, materiales y convenios.

### Costos y gastos

Incluye costos académicos directos, honorarios de tutores, materiales, impresiones, personal, administración, marketing, infraestructura, tecnología, comisiones bancarias, impuestos, depreciaciones y gastos no operativos.

## Nota contable

Este plan es una base inicial robusta. El contador puede agregar, renombrar o inactivar cuentas según la realidad tributaria y operativa de la empresa.
