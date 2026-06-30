# Manual de cambios para frontend

## Alcance

Este backend elimina la creación fragmentada para entidades persona-hija y corrige el flujo de **parte de clases pasadas** para que registre la operación completa sin cuentas fiscales.

Cambios incluidos:

1. Venta de clases pasadas sin IVA, crédito fiscal ni cuentas fiscales.
2. Registro completo de venta-clase: clase, transacción contable, movimientos, cabecera comercial de venta, detalle de venta y registro de trazabilidad.
3. Nuevos endpoints transaccionales para crear estudiante, tutor, usuario y empleado junto con `persona`.
4. Plan de cuentas ajustado: CxC bajo exigible y cuentas fiscales inactivas.
5. Seed de balance de apertura Mayo 2026.

---

## 1. Endpoints de creación no fragmentada

### Ya no usar para crear

No enviar `POST` directo a estos endpoints:

```txt
POST /api/personas/persona
POST /api/personas/estudiante
POST /api/personas/tutor
POST /api/personas/usuario
POST /api/administracion/empleado
POST /api/contabilidad/venta-clase-registro
POST /api/contabilidad/transaccion-venta
POST /api/contabilidad/transaccion-detalle-venta
```

Esos endpoints quedan disponibles para lectura/listado y actualización controlada, pero la creación directa devuelve `400` porque partiría datos entre tablas.

### Crear estudiante

Usar:

```txt
POST /api/personas/estudiante/registrar
```

Payload recomendado:

```json
{
  "persona": {
    "nombres": "Juan",
    "apellidos": "Pérez",
    "telefono": "70000000",
    "email": "juan.perez@correo.com"
  },
  "estudiante": {
    "tipo": "COLEGIAL",
    "nivel_actual": "SECUNDARIA",
    "curso_actual": "SEXTO",
    "turno_actual": "MAÑANA"
  }
}
```

Respuesta principal:

```json
{
  "success": true,
  "data": {
    "persona": {},
    "estudiante": {}
  }
}
```

El backend también crea automáticamente las cuentas asociadas del estudiante:

```txt
ESTUDIANTE_CXC
ESTUDIANTE_PAQUETE_DIFERIDO
```

### Crear tutor

Usar:

```txt
POST /api/personas/tutor/registrar
```

Payload recomendado:

```json
{
  "persona": {
    "nombres": "María",
    "apellidos": "Gómez",
    "telefono": "70000001",
    "email": "maria.gomez@correo.com"
  },
  "tutor": {
    "pago_por_hora": 45,
    "nivel_experiencia": "SENIOR",
    "tipo_estudiante_especialidad": "COLEGIAL",
    "nivel_estudiante_especialidad": "SECUNDARIA"
  }
}
```

El backend crea automáticamente la cuenta por pagar del tutor:

```txt
TUTOR_CXP
```

### Crear usuario interno

Usar:

```txt
POST /api/personas/usuario/registrar
```

Payload recomendado:

```json
{
  "persona": {
    "nombres": "Carlos",
    "apellidos": "Admin",
    "telefono": "70000002",
    "email": "carlos.admin@cpa.com"
  },
  "usuario": {
    "nombre_usuario": "carlos.admin",
    "password": "CambiarEstaClave2026!",
    "tipo_usuario": "ADMIN_GENERAL",
    "es_super_usuario": false
  },
  "roles": ["ADMIN_GENERAL"]
}
```

Notas:

- Solo usuarios con permiso pueden crear usuarios.
- Solo admin con permisos de seguridad puede asignar roles o crear superusuarios.

### Crear empleado

Usar:

```txt
POST /api/administracion/empleado/registrar
```

Payload recomendado:

```json
{
  "persona": {
    "nombres": "Ana",
    "apellidos": "Administrativa",
    "telefono": "70000003",
    "email": "ana@cpa.com"
  },
  "empleado": {
    "fecha_ingreso": "2026-06-01",
    "tipo_contrato": "INDEFINIDO",
    "jornada": "FULL_TIME",
    "email_corporativo": "ana@cpa.com"
  }
}
```

---

## 2. Parte de clases pasadas / venta-clase

Endpoint principal:

```txt
POST /api/contabilidad/venta-clase/registrar-batch
```

El backend ahora exige que la venta cree o vincule una clase real. Para crear la clase desde el parte, cada item debe enviar estos campos:

```txt
fecha
hora_ingreso
id_estudiante
id_tutor
id_aula
id_materia_tree
motivo_clase
```

`hora_salida` es recomendable, pero puede ir vacío si la clase todavía no tiene hora de salida.

Payload ejemplo:

```json
{
  "fecha": "2026-06-25",
  "items": [
    {
      "hora_ingreso": "08:00",
      "hora_salida": "09:00",
      "id_estudiante": 910100,
      "id_tutor": 120,
      "id_aula": 5,
      "id_materia_tree": 10,
      "id_producto_educativo": 3,
      "materia": "Matemáticas",
      "tema": "Álgebra",
      "subtema": "Ecuaciones",
      "motivo_clase": "NIVELACIÓN",
      "cantidad": 1,
      "precio_unitario": 100,
      "efectivo": 50,
      "qr": 20,
      "cxc": 30,
      "paquete": 0,
      "situacion_base": "CLASE_PASADA"
    }
  ]
}
```

### Qué registra el backend por cada item

Por cada fila válida se registra en una sola transacción de base de datos:

1. `servicios_educativos.clase_por_hora`
2. `contabilidad.transaccion`
3. `contabilidad.transaccion_movimiento_cuenta`
4. `contabilidad.transaccion_venta`
5. `contabilidad.transaccion_detalle_venta`
6. `contabilidad.venta_clase_registro`

La respuesta incluye estos objetos:

```json
{
  "venta_clase_registro": {},
  "clase_por_hora": {},
  "transaccion": {},
  "transaccion_venta": {},
  "detalle_venta": {},
  "movimientos": [],
  "totales": {
    "debe": 100,
    "haber": 100
  }
}
```

---

## 3. Impuestos y cuentas fiscales

En parte de clases pasadas ya no enviar:

```txt
porcentaje_impuesto
monto_impuesto
iva
impuesto
id_cuenta_impuesto
codigo_cuenta_impuesto
```

Si se envía un valor fiscal diferente de cero, el backend devuelve `400`.

Motivo: este flujo automático no usa IVA, crédito fiscal ni cuentas fiscales.

---

## 4. Descuentos y recargos

El detalle de venta ahora soporta:

```txt
monto_descuento
porcentaje_descuento
monto_recargo
recargo
```

Regla práctica para frontend:

- `precio_unitario * cantidad` es el importe bruto.
- Si el usuario cobra menos que el bruto y no envía descuento explícito, el backend infiere `monto_descuento`.
- Si el usuario cobra más que el bruto y no envía recargo explícito, el backend infiere `monto_recargo`.
- La suma de formas de pago debe cuadrar con el total final.

Formas de pago:

```txt
efectivo + qr + cxc + paquete = total final
```

Si el frontend no envía ninguna forma de pago, el backend registra automáticamente el total como `cxc` del estudiante.

---

## 5. Plan de cuentas para frontend

Las cuentas fiscales quedan inactivas y no deben mostrarse como opciones activas:

```txt
IVA crédito fiscal
IVA débito fiscal
Tributos por pagar
```

CxC ahora se usa bajo:

```txt
1.1.02 Exigible: cuentas por cobrar
1.1.02.01 Cuentas por cobrar clientes y estudiantes
1.1.02.02 Otras cuentas por cobrar
```

Cuenta base activa de CxC:

```txt
1.1.02.01.001 Cuentas por cobrar estudiantes y clientes
```

Las cuentas dinámicas nuevas de estudiantes se crean con este patrón:

```txt
1.1.02.01.E{id_estudiante}
```

---

## 6. Balance de apertura

La migración agrega un asiento de apertura:

```txt
sub_tipo_transaccion = BALANCE_APERTURA_MAY26
fecha_transaccion = 2026-05-31
```

Total debe y haber:

```txt
446695.24
```

El frontend puede leerlo desde:

```txt
GET /api/contabilidad/transaccion?sub_tipo_transaccion=BALANCE_APERTURA_MAY26
GET /api/contabilidad/transaccion-movimiento-cuenta?id_transaccion=...
```

---

## 7. Ajustes mínimos esperados en frontend

1. Reemplazar formularios de creación fragmentada por los endpoints `/registrar`.
2. En venta-clase, exigir datos mínimos de clase antes de enviar.
3. Quitar campos fiscales del formulario de parte de clases pasadas.
4. Mostrar `transaccion_venta` y `detalle_venta` como comprobante/trazabilidad de venta.
5. En selectores contables, filtrar únicamente `estado_registro=Activo`.
6. Actualizar CxC a grupo `1.1.02.01`.
