# Patch: cuentas operativas configurables y cuentas por estudiante/tutor

## Decisión contable

- **Efectivo** y **QR** no deben quedar quemados en código. Se configuran manualmente en `contabilidad.configuracion_cuenta_operativa`.
- **CxC** y **paquete/ingreso diferido** no deben usar cuenta genérica. Se resuelven por estudiante mediante `contabilidad.cuenta_asignacion`.
- Al crear un estudiante, el backend crea/asocia automáticamente:
  - `ESTUDIANTE_CXC`
  - `ESTUDIANTE_PAQUETE_DIFERIDO`
- Al crear un tutor, el backend crea/asocia automáticamente:
  - `TUTOR_CXP`

## Nueva tabla

```sql
contabilidad.configuracion_cuenta_operativa
```

Uso principal:

| Código | Uso |
|---|---|
| `CANAL_COBRO_EFECTIVO` | Cuenta contable para efectivo |
| `CANAL_COBRO_QR` | Cuenta contable para QR/pagos móviles |
| `IVA_DEBITO_FISCAL` | Cuenta de IVA débito fiscal |
| `INGRESO_CLASE_POR_HORA` | Cuenta de ingreso por clases por hora |

## Endpoints CRUD/batch para configurar cuentas operativas

```http
GET /api/contabilidad/configuracion-cuenta-operativa
GET /api/contabilidad/configuracion-cuenta-operativa/:id_configuracion_cuenta
POST /api/contabilidad/configuracion-cuenta-operativa
PATCH /api/contabilidad/configuracion-cuenta-operativa/:id_configuracion_cuenta
POST /api/contabilidad/configuracion-cuenta-operativa/batch
PATCH /api/contabilidad/configuracion-cuenta-operativa/batch
```

### Cambiar la cuenta de QR

```http
PATCH /api/contabilidad/configuracion-cuenta-operativa/2
```

```json
{
  "id_cuenta": 13
}
```

También puedes listar primero:

```http
GET /api/contabilidad/configuracion-cuenta-operativa?orderBy=id_configuracion_cuenta&orderDir=ASC
```

## Cuentas creadas por estudiante

Al crear:

```http
POST /api/personas/estudiante
```

el backend crea si no existen:

```txt
1.1.03.E{id_estudiante} -> CxC estudiante
2.1.06.E{id_estudiante} -> Paquetes cobrados por anticipado estudiante
```

y las vincula en:

```sql
contabilidad.cuenta_asignacion
```

con:

```txt
ESTUDIANTE_CXC
ESTUDIANTE_PAQUETE_DIFERIDO
```

## Cuentas creadas por tutor

Al crear:

```http
POST /api/personas/tutor
```

el backend crea si no existe:

```txt
2.1.03.T{id_tutor} -> CxP tutor
```

Y lo vincula en:

```sql
contabilidad.cuenta_asignacion
```

con:

```txt
TUTOR_CXP
```

## Impacto en venta-clase

```http
POST /api/contabilidad/venta-clase/registrar-batch
```

Ya no usa una cuenta fija para CxC o paquete.

- Si `efectivo > 0`, busca `CANAL_COBRO_EFECTIVO`.
- Si `qr > 0`, busca `CANAL_COBRO_QR`.
- Si `cxc > 0`, busca `ESTUDIANTE_CXC` del estudiante seleccionado.
- Si `paquete > 0`, busca `ESTUDIANTE_PAQUETE_DIFERIDO` del estudiante seleccionado.

Si una fila tiene `cxc` o `paquete`, debe tener `id_estudiante`. No se recomienda aceptar solo `nombre_estudiante` para movimientos contables reales porque no se podría asociar la cuenta individual del cliente.

## Payload recomendado

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
      "motivo_clase": "NIVELACIÓN",
      "efectivo": 50,
      "qr": 0,
      "cxc": 0,
      "paquete": 0,
      "situacion_base": "CLASE_PASADA"
    }
  ]
}
```

## Migración

```bash
yarn db:migrate:prod
```

Para producción en blanco:

```bash
yarn db:migrate:prod:fresh
```
