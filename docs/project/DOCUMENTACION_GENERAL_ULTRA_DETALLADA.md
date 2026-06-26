# Documentación general ultra detallada - CPA Plataforma Backend

## 1. Propósito del sistema

CPA Plataforma es un backend privado para operación educativa, administrativa, contable, inventario, deuda, infraestructura, seguridad y societario.

El sistema no debe tratarse como un CRUD simple. Tiene dos capas:

1. **CRUD genérico controlado** para tablas maestras y catálogos.
2. **Endpoints inteligentes de negocio** para procesos que deben quedar consistentes, especialmente contabilidad.

Ejemplo de endpoint inteligente:

```http
POST /api/contabilidad/venta-clase/registrar-batch
```

Ese endpoint genera registros operativos y contables en una sola transacción SQL.

---

## 2. Módulos principales

| Módulo | Ruta base | Propósito |
|---|---|---|
| Auth | `/api/auth` | Login, sesión, logout, contraseña. |
| Personas | `/api/personas` | Personas, estudiantes, tutores, padres, proveedores, unidades educativas. |
| Servicios educativos | `/api/servicios_educativos` | Clases, cursos, productos educativos, materias, horarios, asistencia. |
| Contabilidad | `/api/contabilidad` | Cuentas, grupos, costos, transacciones, movimientos, configuración contable. |
| Infraestructura | `/api/infraestructura` | Sucursales, edificios, aulas/espacios, tiendas, encargados. |
| Inventario | `/api/inventario` | Bienes, lotes, instancias, movimientos. |
| Deuda | `/api/deuda` | Deudas y pagos. |
| Seguridad | `/api/seguridad` | Roles, permisos, usuario-rol, usuario-permiso. |
| Societario | `/api/societario` | Títulos, tenencias, dividendos, titulares, transferencias. |

---

## 3. Convención de respuestas

Listados:

```json
{
  "success": true,
  "message": "recurso listado correctamente.",
  "data": [],
  "rows": [],
  "items": [],
  "records": [],
  "count": 0,
  "total": 0,
  "pagination": {
    "count": 0,
    "total": 0,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "pages": 1
  }
}
```

El frontend debe usar `data` como arreglo principal.

---

## 4. Batch genérico

Todos los recursos registrados en `src/modules/resource-registry.ts` aceptan:

```http
POST /api/{modulo}/{recurso}/batch
PATCH /api/{modulo}/{recurso}/batch
```

El batch genérico es para catálogos y tablas simples.

No debe usarse para flujos contables complejos si ya existe endpoint inteligente.

---

## 5. Aulas y espacios

La tabla real es:

```sql
infraestructura.espacio
```

Un aula es un espacio donde:

```txt
tipo = AULA
```

Para simplificar al frontend, existe alias:

```http
/api/infraestructura/aula
```

Ese alias filtra siempre `tipo=AULA`.

---

## 6. Venta clase

La venta de clase pasada se registra por:

```http
POST /api/contabilidad/venta-clase/registrar-batch
```

No se debe pedir al frontend que cree manualmente:

```txt
transaccion
transaccion_detalle_venta
transaccion_movimiento_cuenta
```

El backend lo hace con rollback si algo falla.

---

## 7. Configuración contable

Efectivo y QR se configuran en:

```sql
contabilidad.configuracion_cuenta_operativa
```

No se configuran por `.env`.

CxC y paquete se resuelven por estudiante mediante:

```sql
contabilidad.cuenta_asignacion
```

Tutor tiene CxP por tutor para pagos futuros.

---

## 8. Usuarios base

Los usuarios base se manejan sin correos ficticios `.test`.

Login recomendado por usuario:

```txt
pablo.admin
maria.contador
katia.admin
```

Los correos reales deben cargarse manualmente cuando existan.

---

## 9. Migraciones

Producción vacía:

```bash
yarn db:migrate:prod:fresh
```

Producción con datos:

```bash
yarn db:migrate:prod
```

Nunca usar `fresh` cuando ya existan datos reales.

