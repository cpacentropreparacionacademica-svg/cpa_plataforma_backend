const { z } = require("zod");
const {
  zId,
  zInt,
  zSmallInt,
  zNumeric,
  zDecimal,
  zBoolean,
  zString,
  zText,
  zEmail,
  zPhone,
  zCode,
  zDateOnly,
  zDateTime,
  zTime,
  zJson,
  nullableOptional,
  nonEmptyUpdate,
  listQuerySchema,
} = require("../../../shared/validation/zod.helpers");

// Schema: servicios_educativos.asistencia_clase_curso
// Campos omitidos del body por recomendación: id_asistencia, fecha_registro, estado_registro, id_usuario_modificacion, version_registro.
const asistenciaClaseCursoCreateShape = {
  id_clase_curso: zId, // FK/id
  id_estudiante: zId, // FK/id
  estado_asistencia: zString(15),
  hora_marcacion: nullableOptional(zDateTime),
  observaciones: nullableOptional(zString(240)),
  id_usuario: nullableOptional(zId), // FK/id
};

const asistenciaClaseCursoUpdateShape = {
  id_clase_curso: zId.optional(), // FK/id
  id_estudiante: zId.optional(), // FK/id
  estado_asistencia: zString(15).optional(),
  hora_marcacion: nullableOptional(zDateTime),
  observaciones: nullableOptional(zString(240)),
  id_usuario: nullableOptional(zId), // FK/id
};

const asistenciaClaseCursoCreateSchema = z.object(asistenciaClaseCursoCreateShape).strict();
const asistenciaClaseCursoUpdateSchema = nonEmptyUpdate(z.object(asistenciaClaseCursoUpdateShape).strict().partial());

const asistenciaClaseCursoIdSchema = z.object({
  id_asistencia: zId,
}).strict();

const asistenciaClaseCursoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  asistenciaClaseCursoCreateSchema,
  asistenciaClaseCursoUpdateSchema,
  asistenciaClaseCursoIdSchema,
  asistenciaClaseCursoQuerySchema,
  createSchema: asistenciaClaseCursoCreateSchema,
  updateSchema: asistenciaClaseCursoUpdateSchema,
  idSchema: asistenciaClaseCursoIdSchema,
  querySchema: asistenciaClaseCursoQuerySchema,
};
