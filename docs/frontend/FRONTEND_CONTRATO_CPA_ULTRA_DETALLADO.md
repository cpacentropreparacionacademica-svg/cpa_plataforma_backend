# Contrato ultra detallado para Frontend - CPA Plataforma

## 0. Documento principal

Este es el documento que debe usar el frontend como referencia principal.

Debe implementarse contra el backend NestJS actual, con prefijo:

```txt
/api
```

Todos los endpoints privados requieren sesión opaca mediante:

```http
X-Session-Token: <sessionToken>
```

También puede existir cookie `cpa_session`, pero para frontend separado en Cloudflare/Workers es más seguro y explícito enviar `X-Session-Token`.

---

# 1. Autenticación

## 1.1 Login

Endpoint:

```http
POST /api/auth/publicAuth/login
```

El backend ahora acepta login por correo real o por `nombre_usuario`.

Por compatibilidad histórica, el campo puede seguir llamándose `email`, aunque contenga usuario.

### Payload recomendado

```json
{
  "email": "pablo.admin",
  "password": "PabloAdmin2026!"
}
```

También acepta:

```json
{
  "nombre_usuario": "pablo.admin",
  "password": "PabloAdmin2026!"
}
```

O:

```json
{
  "usuario": "pablo.admin",
  "password": "PabloAdmin2026!"
}
```

### Usuarios base

| Nombre | Usuario | Password provisional | Rol |
|---|---|---|---|
| Pablo Arauz Caballero | `pablo.admin` | `PabloAdmin2026!` | Super admin |
| Maria Sonia Caballero | `maria.contador` | `MariaContador2026!` | Contador |
| Katia Caballero Ardaya | `katia.admin` | `KatiaAdmin2026!` | Super admin |

Notas:

- No se inventaron correos reales.
- Los correos `.test` fueron removidos para los usuarios base.
- El login debe usar `nombre_usuario` hasta que el admin cargue correos reales.
- Después del primer ingreso, se recomienda cambiar contraseñas.

### Respuesta exitosa

```json
{
  "success": true,
  "message": "Login exitoso.",
  "data": {
    "user": {
      "idPersona": "900001",
      "id_persona": "900001",
      "nombre_usuario": "pablo.admin",
      "tipo_usuario": "SUPER_ADMIN",
      "es_super_usuario": true,
      "email": null,
      "nombres": "Pablo",
      "apellidos": "Arauz Caballero"
    },
    "sessionToken": "TOKEN_OPACO",
    "tokenType": "Opaque"
  }
}
```

El frontend debe guardar:

```ts
const token = response.data.data.sessionToken;
```

Y enviarlo en cada request privado:

```ts
headers: {
  "X-Session-Token": token
}
```

---

# 2. Error corregido: aulas

## 2.1 Problema anterior

El frontend intentaba cargar:

```http
GET /api/infraestructura/aula
```

pero el backend original exponía aulas como espacios:

```http
GET /api/infraestructura/espacio?tipo=AULA
```

Por eso aparecía:

```txt
Recurso no encontrado: infraestructura/aula.
```

## 2.2 Solución implementada

Este patch agrega alias lógico:

```http
GET /api/infraestructura/aula
```

Ese endpoint apunta internamente a:

```sql
infraestructura.espacio
```

pero filtra siempre:

```txt
tipo = AULA
```

## 2.3 Endpoints de aula

```http
GET    /api/infraestructura/aula
GET    /api/infraestructura/aula/:id_espacio
POST   /api/infraestructura/aula
POST   /api/infraestructura/aula/batch
PATCH  /api/infraestructura/aula/:id_espacio
PATCH  /api/infraestructura/aula/batch
```

## 2.4 Listar aulas para select

```http
GET /api/infraestructura/aula?page=1&limit=100&orderBy=nombre&orderDir=ASC
```

Respuesta:

```json
{
  "success": true,
  "data": [
    {
      "id_espacio": 1,
      "id_edificio": 1,
      "tipo": "AULA",
      "tipo_aula": "TEORIA",
      "nombre": "Aula Teoría 101",
      "capacidad": 30,
      "estado_registro": "Activo"
    }
  ],
  "rows": [],
  "count": 1,
  "total": 1
}
```

El frontend debe mapear:

```ts
const aulas = normalizeListResponse(response);
```

Label recomendado:

```ts
`${aula.nombre} - Cap. ${aula.capacidad ?? "N/D"}`
```

Value:

```ts
aula.id_espacio
```

## 2.5 Crear aula

```http
POST /api/infraestructura/aula
```

Payload:

```json
{
  "id_edificio": 1,
  "nombre": "Aula 102",
  "tipo_aula": "TEORIA",
  "es_privada": false,
  "piso": 1,
  "capacidad": 25,
  "largo_m": 7,
  "ancho_m": 5,
  "observaciones": "Aula para clases regulares"
}
```

No mandar `tipo`. El backend fuerza:

```txt
tipo = AULA
categoria_sala = NULL
```

---

# 3. Tabla editable: Parte de clases pasadas

## 3.1 Pantalla requerida

La pantalla debe parecer una tabla tipo Excel para registrar filas de clases ya realizadas.

Título sugerido:

```txt
Parte de clases pasadas
```

Mensaje fijo:

```txt
No registres movimientos contables manuales para este flujo. Efectivo, QR, CxC y paquete se resuelven con la configuración y cuentas asociadas desde el backend.
```

## 3.2 Endpoint principal

```http
POST /api/contabilidad/venta-clase/registrar-batch
```

Este es el endpoint recomendado para la tabla.

No usar estos endpoints manualmente para este flujo:

```txt
/api/contabilidad/transaccion
/api/contabilidad/transaccion-detalle-venta
/api/contabilidad/transaccion-movimiento-cuenta
```

El backend crea todo en una transacción SQL.

## 3.3 Columnas visuales

| Columna UI | Campo backend | Tipo | Obligatorio | Comentario |
|---|---|---:|---:|---|
| Fecha | `fecha` | date | Sí | Puede ir en cabecera o por fila. |
| Hora ingreso | `hora_ingreso` | time | Sí para crear clase | Formato `HH:mm`. |
| Hora salida | `hora_salida` | time | No | Formato `HH:mm`. |
| Estudiante | `id_estudiante` | number | Sí para CxC/Paquete | Debe venir de catálogo de estudiantes. |
| Nombre estudiante | `nombre_estudiante` | string | No | Solo fallback visual/trazabilidad. |
| Tutor | `id_tutor` | number | Recomendado | Debe venir de catálogo de tutores. |
| Nombre tutor | `nombre_tutor` | string | No | Solo fallback visual/trazabilidad. |
| Aula | `id_aula` | number | Recomendado | Viene de `/api/infraestructura/aula`. |
| Materia/tema/subtema | `id_materia_tree` | number | Recomendado | Viene de `/api/servicios_educativos/materia-tree`. |
| Producto | `id_producto_educativo` | number | Recomendado | Viene de `/api/servicios_educativos/producto-educativo`. |
| Motivo clase | `motivo_clase` | string | Sí | Ej.: Nivelación, práctica, recuperación. |
| Efectivo | `efectivo` | number | No | Monto cobrado en caja. |
| QR | `qr` | number | No | Monto cobrado por QR. |
| CxC | `cxc` | number | No | Requiere estudiante con cuenta CxC asociada. |
| Paq. | `paquete` | number | No | Consume ingreso diferido asociado al estudiante. |
| Sit. Base | `situacion_base` | string | No | Ej.: `CLASE_PASADA`. |

## 3.4 Reglas de envío

Una fila se envía si tiene al menos:

```txt
hora_ingreso + estudiante/tutor/texto + algún monto mayor a 0
```

No enviar filas completamente vacías.

El frontend debe sumar montos:

```ts
totalFila = efectivo + qr + cxc + paquete;
```

Si `totalFila <= 0`, no enviar o marcar error.

## 3.5 Payload batch

```json
{
  "fecha": "2026-06-26",
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

## 3.6 Respuesta esperada

```json
{
  "success": true,
  "message": "1 venta(s) de clase registrada(s) correctamente.",
  "data": [
    {
      "index": 0,
      "success": true,
      "id_venta_clase_registro": 1,
      "id_transaccion": 1,
      "id_clase": 1,
      "total": 50,
      "warnings": []
    }
  ],
  "count": 1
}
```

Si una fila viene sin FK suficiente para crear `clase_por_hora`, el backend puede registrar venta/trazabilidad y devolver warning.

---

# 4. Catálogos necesarios para la tabla

## 4.1 Estudiantes

```http
GET /api/personas/estudiante?page=1&limit=100
```

La tabla `persona_estudiante` guarda datos del estudiante, pero el nombre completo está en `persona.persona`. Si el frontend necesita nombres completos y el endpoint genérico no los trae unidos, hay dos opciones:

1. usar `id_estudiante` y mostrar campo texto capturado;
2. pedir endpoint vista enriquecida en backend.

Para este flujo, el backend acepta:

```txt
id_estudiante
nombre_estudiante
```

Pero si hay `cxc` o `paquete`, `id_estudiante` es obligatorio.

## 4.2 Tutores

```http
GET /api/personas/tutor?page=1&limit=100
```

Para trazabilidad puede enviarse:

```txt
id_tutor
nombre_tutor
```

## 4.3 Aulas

Usar este endpoint corregido:

```http
GET /api/infraestructura/aula?page=1&limit=100&orderBy=nombre&orderDir=ASC
```

No usar:

```http
GET /api/infraestructura/aulaX
GET /api/infraestructura/sala
```

## 4.4 Materias, temas y subtemas

```http
GET /api/servicios_educativos/materia-tree?page=1&limit=100&orderBy=nombre&orderDir=ASC
```

Filtros útiles:

```http
GET /api/servicios_educativos/materia-tree?nombre=Matemáticas
GET /api/servicios_educativos/materia-tree?nombre=Física
GET /api/servicios_educativos/materia-tree?nombre=Química
```

## 4.5 Productos educativos

```http
GET /api/servicios_educativos/producto-educativo?page=1&limit=100
```

Productos esperados:

```txt
Clases de Matemáticas
Clases de Física
Clases de Química
Curso de Becas CRE
Curso de nivelación Matemáticas
Curso de nivelación Física
Curso de nivelación Química
Paquetes de horas
```

## 4.6 Unidades educativas

```http
GET /api/personas/unidad-educativa?page=1&limit=100&orderBy=nombre&orderDir=ASC
```

Sirve para formularios de estudiantes.

---

# 5. Configuración contable de cuentas operativas

## 5.1 Endpoint

```http
GET   /api/contabilidad/configuracion-cuenta-operativa
POST  /api/contabilidad/configuracion-cuenta-operativa
PATCH /api/contabilidad/configuracion-cuenta-operativa/:id_configuracion_cuenta
```

## 5.2 Claves importantes

```txt
CANAL_COBRO_EFECTIVO
CANAL_COBRO_QR
IVA_DEBITO_FISCAL
INGRESO_CLASE_POR_HORA
```

Efectivo y QR se configuran manualmente desde base/frontend, no desde `.env`.

CxC y paquete NO se configuran globalmente. Se resuelven por estudiante.

## 5.3 Flujo correcto

```txt
Efectivo -> cuenta configurada CANAL_COBRO_EFECTIVO
QR       -> cuenta configurada CANAL_COBRO_QR
CxC      -> cuenta ESTUDIANTE_CXC asociada al estudiante
Paquete  -> cuenta ESTUDIANTE_PAQUETE_DIFERIDO asociada al estudiante
```

## 5.4 Crear/editar configuración

```json
{
  "codigo": "CANAL_COBRO_EFECTIVO",
  "nombre": "Canal de cobro efectivo",
  "descripcion": "Cuenta contable para cobros en efectivo",
  "id_cuenta": 1,
  "estado_registro": "Activo"
}
```

El frontend debe mostrar selector de cuentas:

```http
GET /api/contabilidad/cuenta?page=1&limit=100&orderBy=codigo&orderDir=ASC
```

---

# 6. Cuentas automáticas por estudiante y tutor

## 6.1 Al crear estudiante

Endpoint:

```http
POST /api/personas/estudiante
```

El backend crea automáticamente:

```txt
ESTUDIANTE_CXC
ESTUDIANTE_PAQUETE_DIFERIDO
```

en `contabilidad.cuenta_asignacion`.

Por eso, si una fila de venta-clase tiene `cxc` o `paquete`, debe tener `id_estudiante`.

## 6.2 Al crear tutor

Endpoint:

```http
POST /api/personas/tutor
```

El backend crea automáticamente:

```txt
TUTOR_CXP
```

Esto servirá para pagos a tutores y costos futuros.

---

# 7. Normalizador de respuestas

Todos los listados devuelven `data` como arreglo por defecto.

Aun así, usar normalizador defensivo:

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

---

# 8. Servicio Axios recomendado

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cpa_session_token");
  if (token) {
    config.headers["X-Session-Token"] = token;
  }
  return config;
});
```

## 8.1 Login

```ts
export async function login(usuario: string, password: string) {
  const response = await api.post("/api/auth/publicAuth/login", {
    email: usuario,
    password,
  });

  const token = response.data?.data?.sessionToken;
  if (token) localStorage.setItem("cpa_session_token", token);

  return response.data;
}
```

## 8.2 Cargar aulas

```ts
export async function getAulas() {
  const response = await api.get("/api/infraestructura/aula", {
    params: {
      page: 1,
      limit: 100,
      orderBy: "nombre",
      orderDir: "ASC",
    },
  });

  return normalizeListResponse(response);
}
```

## 8.3 Enviar venta clase batch

```ts
export async function registrarVentaClaseBatch(fecha: string, rows: any[]) {
  const items = rows
    .filter((row) => !row.__empty)
    .map((row) => ({
      hora_ingreso: row.horaIngreso || undefined,
      hora_salida: row.horaSalida || undefined,
      id_estudiante: row.idEstudiante || undefined,
      nombre_estudiante: row.nombreEstudiante || undefined,
      id_tutor: row.idTutor || undefined,
      nombre_tutor: row.nombreTutor || undefined,
      id_aula: row.idAula || undefined,
      id_materia_tree: row.idMateriaTree || undefined,
      id_producto_educativo: row.idProductoEducativo || undefined,
      materia: row.materia || undefined,
      tema: row.tema || undefined,
      subtema: row.subtema || undefined,
      motivo_clase: row.motivoClase || "Clase pasada",
      efectivo: Number(row.efectivo || 0),
      qr: Number(row.qr || 0),
      cxc: Number(row.cxc || 0),
      paquete: Number(row.paquete || 0),
      situacion_base: row.situacionBase || "CLASE_PASADA",
    }))
    .filter((item) => (item.efectivo + item.qr + item.cxc + item.paquete) > 0);

  return api.post("/api/contabilidad/venta-clase/registrar-batch", {
    fecha,
    items,
  });
}
```

---

# 9. Batch genérico

Todos los recursos registrados aceptan batch:

```http
POST  /api/{modulo}/{recurso}/batch
PATCH /api/{modulo}/{recurso}/batch
```

Ejemplo:

```http
POST /api/personas/unidad-educativa/batch
```

```json
{
  "items": [
    {
      "nombre": "Colegio Demo",
      "categoria": "privada",
      "estado_registro": true
    }
  ]
}
```

Límite recomendado: 200 registros por solicitud.

Para venta-clase usar el endpoint especializado, no el batch genérico.

---

# 10. Errores comunes y cómo mostrarlos

## 10.1 Recurso no encontrado

```txt
Recurso no encontrado: infraestructura/aula.
```

Debe desaparecer con este patch. El endpoint `/api/infraestructura/aula` ahora existe.

## 10.2 Sesión inválida

Status:

```txt
401 / 403
```

Mostrar:

```txt
Tu sesión expiró. Vuelve a iniciar sesión.
```

## 10.3 Cuenta contable faltante

Puede pasar si no configuraron efectivo/QR o si el estudiante no tiene cuentas asociadas.

Mostrar:

```txt
Falta configuración contable. Revisa cuentas operativas o cuentas asociadas al estudiante.
```

## 10.4 CxC o paquete sin estudiante

Mostrar:

```txt
Para registrar CxC o paquete debes seleccionar un estudiante válido.
```

---

# 11. Checklist frontend

Antes de probar venta-clase:

- [ ] Login funciona con `pablo.admin`, `maria.contador` o `katia.admin`.
- [ ] El token se guarda y se envía como `X-Session-Token`.
- [ ] `/api/infraestructura/aula` carga aulas.
- [ ] `/api/servicios_educativos/materia-tree` carga Matemáticas, Física y Química.
- [ ] `/api/personas/unidad-educativa` carga colegios/universidades.
- [ ] `/api/servicios_educativos/producto-educativo` carga clases/cursos.
- [ ] `/api/contabilidad/configuracion-cuenta-operativa` muestra efectivo/QR/ingresos.
- [ ] La tabla no envía filas vacías.
- [ ] La tabla no permite CxC/paquete sin estudiante.
- [ ] El submit usa `/api/contabilidad/venta-clase/registrar-batch`.
- [ ] El frontend muestra warnings por fila si el backend los devuelve.

