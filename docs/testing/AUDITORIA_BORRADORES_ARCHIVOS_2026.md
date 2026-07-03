# Auditoría estricta - borradores y archivos independientes

## Riesgos detectados

1. **Guardar formularios incompletos directo en tablas finales**
   - Riesgo: romper constraints, FK, reglas contables y crear datos basura.
   - Corrección: se agregó `administracion.registro_borrador` como contenedor genérico de payloads incompletos.

2. **Archivo obligado a transacción**
   - Riesgo: no se pueden subir documentos previos, cotizaciones, comprobantes pendientes o archivos administrativos sin asiento contable.
   - Corrección: se agregó `contabilidad.archivo` como maestro independiente.

3. **Mezcla archivo-documento con relación archivo-transacción**
   - Riesgo: modelo rígido, difícil de mantener y limitado a 1 transacción por archivo.
   - Corrección: se agregó `contabilidad.archivo_transaccion` como tabla puente.

4. **Compatibilidad legacy**
   - Riesgo: romper frontend o integraciones que aún llaman `archivos-transaccion`.
   - Corrección: se mantiene el recurso legacy y se relajan `id_transaccion`/`link_achivo` para no bloquear casos sin transacción.

5. **Creación en dos pasos no atómica**
   - Riesgo: crear archivo y fallar al asociar, dejando inconsistencias.
   - Corrección: `POST /api/contabilidad/archivo-transaccion/registrar` crea archivo + asociación en una sola transacción de base de datos.

## Verificación aplicada

- `tsc --noEmit`: OK.
- `nest build`: OK.
- `dist/main.js`: generado correctamente.

## Endpoints nuevos principales

- `POST /api/administracion/registro-borrador`
- `GET /api/administracion/registro-borrador`
- `PATCH /api/administracion/registro-borrador/:id_borrador`
- `POST /api/contabilidad/archivo/registrar`
- `POST /api/contabilidad/archivo-transaccion/registrar`
- CRUD genérico:
  - `/api/contabilidad/archivo`
  - `/api/contabilidad/archivo-transaccion`

## Recomendación frontend

El frontend debe guardar borradores en `registro-borrador` y solo publicar al endpoint real cuando el usuario confirme. No usar tablas finales como almacenamiento temporal.
