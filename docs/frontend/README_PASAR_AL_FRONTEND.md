# DOCUMENTO QUE DEBES PASAR AL FRONTEND

Este es el documento principal que debe recibir el equipo/frontend:

**`docs/frontend/FRONTEND_CONTRATO_CPA_ULTRA_DETALLADO.md`**

Ese documento contiene el contrato completo para implementar:

- login por usuario o email;
- tabla editable de parte de clases pasadas;
- endpoint inteligente de venta de clase;
- catálogos para selects;
- configuración de cuentas contables;
- endpoint correcto de aulas;
- normalización de respuestas;
- batch genérico;
- validaciones frontend;
- errores esperados;
- flujo de despliegue y pruebas.

## Corrección urgente del error actual

El frontend está intentando cargar:

```http
GET /api/infraestructura/aula
```

En el backend original solo existía:

```http
GET /api/infraestructura/espacio?tipo=AULA
```

Este patch agrega alias compatible:

```http
GET /api/infraestructura/aula
GET /api/infraestructura/aula/:id_espacio
POST /api/infraestructura/aula
POST /api/infraestructura/aula/batch
PATCH /api/infraestructura/aula/:id_espacio
PATCH /api/infraestructura/aula/batch
```

Internamente `aula` apunta a la tabla real:

```sql
infraestructura.espacio
```

con filtro forzado:

```txt
tipo = AULA
```

Por tanto, el frontend puede seguir usando `infraestructura/aula` sin romper.

