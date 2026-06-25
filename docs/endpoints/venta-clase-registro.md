# Endpoint: Parte de clases pasadas a venta contable

Este patch agrega endpoints especializados para convertir la planilla tipo **PARTE DE CLASES PASADAS** en registros consistentes de backend.

## Endpoints

```http
POST /api/contabilidad/venta-clase/registrar
POST /api/contabilidad/venta-clase/registrar-batch
```

Ambos requieren:

```http
Content-Type: application/json
X-Session-Token: <sessionToken>
```

## Qué crea internamente

Por cada fila recibida, el backend ejecuta todo dentro de una transacción SQL:

1. Crea o vincula `servicios_educativos.clase_por_hora` si existen los IDs necesarios.
2. Crea `contabilidad.transaccion` con `tipo_transaccion = 'VENTA'`.
3. Crea `contabilidad.transaccion_detalle_venta`.
4. Crea movimientos en `contabilidad.transaccion_movimiento_cuenta`.
5. Guarda la fila original en `contabilidad.venta_clase_registro`.
6. Valida que el asiento esté balanceado: `Debe = Haber`.
7. Si algo falla, hace rollback completo.

## Payload batch recomendado para frontend

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
      "situacion_base": "CLASE_PASADA"
    }
  ]
}
```

## Payload mínimo si todavía no tienes IDs relacionados

El endpoint permite registrar la venta y guardar trazabilidad aunque no pueda crear `clase_por_hora` por falta de FKs. En ese caso devuelve una advertencia en `warnings`.

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

## Cuentas usadas por defecto

Si el frontend no envía cuentas explícitas, el backend usa los códigos del plan de cuentas cargado por seed:

| Caso | Código cuenta |
|---|---|
| Efectivo | `1.1.01.001` |
| QR / pagos móviles | `1.1.01.013` |
| Cuenta por cobrar estudiante | `1.1.03.001` |
| Paquete consumido / ingreso diferido | `2.1.06.003` |
| Ingreso clases por hora | `4.1.01.001` |
| IVA débito fiscal, si aplica | `2.1.05.001` |

También puedes sobreescribirlas por fila:

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
  "codigo_cuenta_efectivo": "1.1.01.001"
}
```

## Interpretación contable

### Efectivo

```txt
Debe: Caja moneda nacional
Haber: Ingresos por clases por hora
```

### QR

```txt
Debe: Fondos en QR / pagos móviles
Haber: Ingresos por clases por hora
```

### CxC

```txt
Debe: Cuentas por cobrar estudiantes - clases por hora
Haber: Ingresos por clases por hora
```

### Paquete

```txt
Debe: Ingresos diferidos por paquetes de horas
Haber: Ingresos por clases por hora
```

## Respuesta esperada

```json
{
  "success": true,
  "message": "2 venta(s) de clase registradas correctamente con detalle y asiento contable.",
  "data": {
    "count": 2,
    "monto_total": 100,
    "registros": [
      {
        "venta_clase_registro": {},
        "clase_por_hora": {},
        "transaccion": {},
        "detalle_venta": {},
        "movimientos": [],
        "totales": {
          "debe": 50,
          "haber": 50
        },
        "warnings": []
      }
    ]
  }
}
```

## Tabla CRUD de trazabilidad

También queda disponible como recurso CRUD normal:

```http
GET /api/contabilidad/venta-clase-registro
GET /api/contabilidad/venta-clase-registro/:id_venta_clase_registro
PATCH /api/contabilidad/venta-clase-registro/:id_venta_clase_registro
```
