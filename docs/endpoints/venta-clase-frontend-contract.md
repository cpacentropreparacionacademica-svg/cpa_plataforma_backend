# Contrato frontend - Parte de clases pasadas / Venta de clase

Este documento describe exactamente cómo debe integrarse el frontend con el endpoint especializado que convierte la tabla **PARTE DE CLASES PASADAS** en registros operativos y contables.

## Objetivo funcional

La pantalla del frontend debe comportarse como una tabla editable tipo Excel. Cada fila representa una clase pasada que se desea registrar como venta.

El frontend **no debe crear manualmente** la transacción, el detalle de venta y los movimientos contables usando varios endpoints. Debe enviar una sola solicitud al backend. El backend se encarga de crear todo dentro de una transacción SQL y hacer rollback si algo falla.

---

## Endpoints principales

### Registrar una sola fila

```http
POST /api/contabilidad/venta-clase/registrar
```

### Registrar varias filas

```http
POST /api/contabilidad/venta-clase/registrar-batch
```

### Headers obligatorios

```http
Content-Type: application/json
X-Session-Token: <sessionToken>
```

---

## Columnas recomendadas para la tabla frontend

Estas columnas salen directamente del formulario físico de la foto.

| Columna frontend | Campo JSON | Tipo | Obligatorio | Comentario |
|---|---|---:|---:|---|
| Fecha | `fecha` | string `YYYY-MM-DD` | Sí | Puede ir en la raíz del payload para todas las filas. |
| Hora ingreso | `hora_ingreso` | string `HH:mm` o `HH:mm:ss` | Recomendado | Necesario para crear `clase_por_hora`. |
| Hora salida | `hora_salida` | string `HH:mm` o `HH:mm:ss` | No | Si existe, se guarda como salida/cierre de clase. |
| Nombre completo estudiante | `nombre_estudiante` | string | Recomendado | Texto visible aunque no exista ID. |
| Estudiante | `id_estudiante` | number | No | Si existe, permite vincular a `persona.persona_estudiante`. |
| Tutor | `nombre_tutor` | string | Recomendado | Texto visible aunque no exista ID. |
| Tutor ID | `id_tutor` | number | No | Si existe, permite vincular a `persona.persona_tutor`. |
| Aula / Espacio | `id_aula` | number | No | Requerido para crear `clase_por_hora`. |
| Motivo clase | `motivo_clase` | string | Recomendado | Motivo o descripción breve de la clase. |
| Materia / Producto | `materia` | string | Recomendado | Texto libre visible del parte. |
| Producto educativo | `id_producto_educativo` | number | No | Si existe, vincula con producto educativo. |
| Materia tree | `id_materia_tree` | number | No | Requerido para crear `clase_por_hora`. |
| Tema | `tema` | string | No | Tema revisado. |
| Subtema | `subtema` | string | No | Subtema revisado. |
| Efectivo | `efectivo` o `monto_efectivo` | number | No | Monto cobrado en efectivo. |
| QR | `qr` o `monto_qr` | number | No | Monto cobrado por QR/pagos móviles. |
| CxC | `cxc` o `monto_cxc` | number | No | Monto enviado a cuenta por cobrar. |
| Paq. | `paquete`, `paq` o `monto_paquete` | number | No | Monto consumido de paquete. |
| Sit. Base | `situacion_base` o `sit_base` | string | No | Por defecto: `CLASE_PASADA`. |
| Observaciones | `observaciones` | string | No | Comentarios internos. |

Regla importante: cada fila debe tener al menos un importe positivo en `efectivo`, `qr`, `cxc`, `paquete` o un `precio_unitario` positivo.

---

## Payload recomendado para registrar varias filas

Usa este endpoint para la tabla del frontend:

```http
POST /api/contabilidad/venta-clase/registrar-batch
```

```json
{
  "fecha": "2026-06-25",
  "items": [
    {
      "hora_ingreso": "08:00",
      "hora_salida": "10:00",
      "id_estudiante": 15,
      "nombre_estudiante": "Juan Perez",
      "id_tutor": 3,
      "nombre_tutor": "Tutor Demo",
      "id_aula": 1,
      "id_materia_tree": 7,
      "id_producto_educativo": 2,
      "materia": "Matemáticas",
      "tema": "Funciones",
      "subtema": "Función cuadrática",
      "motivo_clase": "Nivelación",
      "efectivo": 50,
      "qr": 0,
      "cxc": 0,
      "paquete": 0,
      "situacion_base": "CLASE_PASADA",
      "observaciones": "Registrado desde parte manual"
    },
    {
      "hora_ingreso": "10:00",
      "hora_salida": "11:30",
      "nombre_estudiante": "Estudiante sin ID todavía",
      "nombre_tutor": "Tutor sin ID todavía",
      "materia": "Física",
      "tema": "Cinemática",
      "subtema": "MRUV",
      "motivo_clase": "Repaso para examen",
      "qr": 80,
      "situacion_base": "CLASE_PASADA"
    }
  ]
}
```

---

## Payload para registrar una sola fila

Puedes enviar una fila directa:

```http
POST /api/contabilidad/venta-clase/registrar
```

```json
{
  "fecha": "2026-06-25",
  "hora_ingreso": "08:00",
  "hora_salida": "10:00",
  "id_estudiante": 15,
  "nombre_estudiante": "Juan Perez",
  "id_tutor": 3,
  "nombre_tutor": "Tutor Demo",
  "id_aula": 1,
  "id_materia_tree": 7,
  "id_producto_educativo": 2,
  "materia": "Matemáticas",
  "tema": "Funciones",
  "subtema": "Función cuadrática",
  "motivo_clase": "Nivelación",
  "efectivo": 50,
  "situacion_base": "CLASE_PASADA"
}
```

También acepta:

```json
{
  "fecha": "2026-06-25",
  "items": [
    {
      "hora_ingreso": "08:00",
      "hora_salida": "10:00",
      "nombre_estudiante": "Juan Perez",
      "nombre_tutor": "Tutor Demo",
      "materia": "Matemáticas",
      "tema": "Funciones",
      "subtema": "Función cuadrática",
      "motivo_clase": "Nivelación",
      "efectivo": 50
    }
  ]
}
```

Pero para varias filas siempre usa `/registrar-batch`.

---

## Campos alternativos aceptados por backend

El backend acepta varios alias para facilitar el frontend:

| Concepto | Campos aceptados |
|---|---|
| Fecha | `fecha`, `fecha_transaccion` |
| Hora ingreso | `hora_ingreso`, `hora_llegada` |
| ID estudiante | `id_estudiante`, `id_cliente` |
| Nombre estudiante | `nombre_estudiante`, `estudiante_texto`, `nombre_completo_estudiante` |
| Tutor texto | `nombre_tutor`, `tutor_texto` |
| Aula | `id_aula`, `id_espacio` |
| Materia tree | `id_materia_tree`, `id_tree` |
| Clase por hora | `id_clase_por_hora`, `id_clase` |
| Materia/producto texto | `materia`, `materia_texto`, `producto`, `materia_producto` |
| Motivo | `motivo_clase`, `motivo` |
| Efectivo | `efectivo`, `monto_efectivo` |
| QR | `qr`, `monto_qr` |
| Cuenta por cobrar | `cxc`, `monto_cxc`, `cuenta_por_cobrar` |
| Paquete | `paquete`, `paq`, `monto_paquete` |
| Situación base | `situacion_base`, `sit_base` |

---

## Respuesta exitosa esperada

```json
{
  "success": true,
  "message": "2 venta(s) de clase registradas correctamente con detalle y asiento contable.",
  "data": {
    "count": 2,
    "monto_total": 130,
    "registros": [
      {
        "venta_clase_registro": {
          "id_venta_clase_registro": 1,
          "fecha": "2026-06-25",
          "estudiante_texto": "Juan Perez",
          "materia_texto": "Matemáticas",
          "monto_total": "50.00",
          "id_transaccion": 100,
          "id_detalle_venta": 200,
          "estado_proceso": "REGISTRADO"
        },
        "clase_por_hora": {
          "id_clase": 10
        },
        "transaccion": {
          "id_transaccion": 100,
          "tipo_transaccion": "VENTA",
          "sub_tipo_transaccion": "VENTA_CLASE_PASADA"
        },
        "detalle_venta": {
          "id_detalle_venta": 200,
          "id_transaccion": 100,
          "descripcion": "Matemáticas",
          "monto_total": "50.00"
        },
        "movimientos": [
          {
            "id_movimiento": 1,
            "id_transaccion": 100,
            "id_cuenta": 1,
            "debe": 50,
            "haber": 0
          },
          {
            "id_movimiento": 2,
            "id_transaccion": 100,
            "id_cuenta": 120,
            "debe": 0,
            "haber": 50
          }
        ],
        "totales": {
          "debe": 50,
          "haber": 50
        },
        "monto_total": 50,
        "warnings": []
      }
    ]
  }
}
```

---

## Advertencias posibles

Si faltan IDs para crear la clase operativa, el backend igual puede registrar venta + contabilidad + trazabilidad, pero devolverá advertencias:

```json
{
  "warnings": [
    "No se creó servicios_educativos.clase_por_hora porque faltan IDs obligatorios: id_aula, id_estudiante, id_tutor, id_materia_tree y hora_ingreso. Se registró la venta y la trazabilidad del parte."
  ]
}
```

En frontend muestra estas advertencias como aviso amarillo, no como error rojo.

---

## Errores comunes

### Fila sin importe

```json
{
  "success": false,
  "message": "La fila 1 debe tener importe positivo en efectivo, QR, CxC, paquete o precio_unitario."
}
```

### Formas de pago no cuadran con total

```json
{
  "success": false,
  "message": "La fila 1 no cuadra: formas de pago=100, total venta=80."
}
```

### Cuenta contable no encontrada

```json
{
  "success": false,
  "message": "No se encontró cuenta de ingreso por clases por hora. Código buscado: 4.1.01.001. Puedes enviar id_cuenta explícito en el payload."
}
```

### Hora inválida

```json
{
  "success": false,
  "message": "La hora '8am' debe tener formato HH:mm o HH:mm:ss."
}
```

---

## Cuentas contables usadas por defecto

| Forma / concepto | Código cuenta | Descripción |
|---|---|---|
| Efectivo | `1.1.01.001` | Caja moneda nacional |
| QR | `1.1.01.013` | Fondos en QR / pagos móviles |
| CxC | `1.1.03.001` | Cuentas por cobrar estudiantes - clases por hora |
| Paquete | `2.1.06.003` | Ingresos diferidos por paquetes de horas |
| Ingreso | `4.1.01.001` | Ingresos por clases por hora |
| IVA débito fiscal | `2.1.05.001` | IVA débito fiscal |

Puedes sobreescribir cuentas por ID:

```json
{
  "id_cuenta_ingreso": 123,
  "id_cuenta_efectivo": 10,
  "id_cuenta_qr": 11,
  "id_cuenta_cxc": 12,
  "id_cuenta_paquete_diferido": 13,
  "id_cuenta_iva_debito": 14
}
```

O por código:

```json
{
  "codigo_cuenta_ingreso": "4.1.01.001",
  "codigo_cuenta_efectivo": "1.1.01.001",
  "codigo_cuenta_qr": "1.1.01.013",
  "codigo_cuenta_cxc": "1.1.03.001",
  "codigo_cuenta_paquete_diferido": "2.1.06.003",
  "codigo_cuenta_iva_debito": "2.1.05.001"
}
```

---

## CRUD de trazabilidad para mostrar historial

Luego de registrar ventas de clase, puedes listar el historial con:

```http
GET /api/contabilidad/venta-clase-registro?page=1&limit=20&orderBy=id_venta_clase_registro&orderDir=DESC
```

Respuesta de listado compatible con el frontend:

```json
{
  "success": true,
  "message": "venta_clase_registro listado correctamente.",
  "data": [
    {
      "id_venta_clase_registro": 1,
      "fecha": "2026-06-25",
      "hora_ingreso": "08:00:00",
      "hora_salida": "10:00:00",
      "estudiante_texto": "Juan Perez",
      "tutor_texto": "Tutor Demo",
      "materia_texto": "Matemáticas",
      "tema": "Funciones",
      "subtema": "Función cuadrática",
      "monto_efectivo": "50.00",
      "monto_qr": "0.00",
      "monto_cxc": "0.00",
      "monto_paquete": "0.00",
      "monto_total": "50.00",
      "id_transaccion": 100,
      "id_detalle_venta": 200,
      "estado_proceso": "REGISTRADO"
    }
  ],
  "count": 1,
  "total": 1
}
```

---

## Normalizador recomendado para frontend

Usa este normalizador para todos los listados CRUD:

```ts
export function normalizeListResponse(response: any): any[] {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.records)) return payload.records;

  return [];
}
```

Para este endpoint especializado, usa:

```ts
export function normalizeVentaClaseResult(response: any) {
  const payload = response?.data ?? response;
  const data = payload?.data ?? payload;

  return {
    count: Number(data?.count ?? 0),
    montoTotal: Number(data?.monto_total ?? 0),
    registros: Array.isArray(data?.registros) ? data.registros : [],
  };
}
```

---

## Ejemplo de integración con Axios

```ts
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function registrarParteClasesPasadas(token: string, fecha: string, rows: any[]) {
  const payload = {
    fecha,
    items: rows.map((row) => ({
      hora_ingreso: row.horaIngreso,
      hora_salida: row.horaSalida,
      id_estudiante: row.idEstudiante || undefined,
      nombre_estudiante: row.nombreEstudiante,
      id_tutor: row.idTutor || undefined,
      nombre_tutor: row.nombreTutor,
      id_aula: row.idAula || undefined,
      id_materia_tree: row.idMateriaTree || undefined,
      id_producto_educativo: row.idProductoEducativo || undefined,
      materia: row.materia,
      tema: row.tema,
      subtema: row.subtema,
      motivo_clase: row.motivoClase,
      efectivo: Number(row.efectivo || 0),
      qr: Number(row.qr || 0),
      cxc: Number(row.cxc || 0),
      paquete: Number(row.paquete || 0),
      situacion_base: row.situacionBase || "CLASE_PASADA",
      observaciones: row.observaciones || undefined,
    })),
  };

  const response = await axios.post(
    `${API_BASE_URL}/api/contabilidad/venta-clase/registrar-batch`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Session-Token": token,
      },
    },
  );

  return normalizeVentaClaseResult(response);
}
```

---

## Reglas de UI recomendadas

1. Validar que cada fila tenga `efectivo + qr + cxc + paquete > 0`.
2. Validar formato de fecha `YYYY-MM-DD`.
3. Validar horas como `HH:mm`.
4. Permitir guardar aunque falten IDs, pero mostrar advertencia de que no se creó `clase_por_hora`.
5. Después de registrar, refrescar:
   - `/api/contabilidad/venta-clase-registro`
   - `/api/contabilidad/transaccion`
   - `/api/contabilidad/transaccion-detalle-venta`
   - `/api/contabilidad/transaccion-movimiento-cuenta`

## Actualización: cuentas contables por estudiante y configuración manual

El endpoint `venta-clase` ya no debe depender de cuentas fijas quemadas en código para CxC ni para paquetes.

### Reglas vigentes

| Forma de pago | Cuenta usada |
|---|---|
| `efectivo` | `contabilidad.configuracion_cuenta_operativa.codigo = CANAL_COBRO_EFECTIVO` |
| `qr` | `contabilidad.configuracion_cuenta_operativa.codigo = CANAL_COBRO_QR` |
| `cxc` | `contabilidad.cuenta_asignacion.entidad_tipo = ESTUDIANTE_CXC` para el `id_estudiante` seleccionado |
| `paquete` | `contabilidad.cuenta_asignacion.entidad_tipo = ESTUDIANTE_PAQUETE_DIFERIDO` para el `id_estudiante` seleccionado |

Si una fila usa `cxc` o `paquete`, el frontend debe enviar `id_estudiante`. El nombre del estudiante puede mostrarse para UX, pero contablemente no es suficiente.

### Configuración manual de efectivo y QR

El frontend puede listar y modificar las cuentas operativas en:

```http
GET /api/contabilidad/configuracion-cuenta-operativa
PATCH /api/contabilidad/configuracion-cuenta-operativa/:id_configuracion_cuenta
```

Ejemplo para cambiar la cuenta QR:

```json
{
  "id_cuenta": 13
}
```

### Creación automática de cuentas

Cuando se crea un estudiante con:

```http
POST /api/personas/estudiante
```

o por batch:

```http
POST /api/personas/estudiante/batch
```

el backend crea automáticamente:

```txt
ESTUDIANTE_CXC
ESTUDIANTE_PAQUETE_DIFERIDO
```

Cuando se crea un tutor con:

```http
POST /api/personas/tutor
```

o por batch:

```http
POST /api/personas/tutor/batch
```

el backend crea automáticamente:

```txt
TUTOR_CXP
```
