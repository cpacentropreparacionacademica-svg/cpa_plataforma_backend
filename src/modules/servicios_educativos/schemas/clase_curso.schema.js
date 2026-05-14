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

// Schema: servicios_educativos.clase_curso
// Campos omitidos del body por recomendación: id_clase_curso, fecha_registro, fecha_modificacion, estado_registro, id_usuario_modificacion, version_registro.
const claseCursoCreateShape = {
  id_curso_version: zId, // FK/id
  id_aula: nullableOptional(zId), // FK/id
  id_tutor: nullableOptional(zId), // FK/id
  fecha: zDateOnly,
  hora_inicio_real: zTime,
  hora_fin_real: zTime,
  estado: zString(20).optional(),
  modalidad: nullableOptional(zString(30)),
  detalle_temas_revisados: nullableOptional(zString(200)),
  observaciones: nullableOptional(zString(300)),
  motivo_cancelacion: nullableOptional(zString(200)),
  id_usuario: nullableOptional(zId), // FK/id
};

const claseCursoUpdateShape = {
  id_curso_version: zId.optional(), // FK/id
  id_aula: nullableOptional(zId), // FK/id
  id_tutor: nullableOptional(zId), // FK/id
  fecha: zDateOnly.optional(),
  hora_inicio_real: zTime.optional(),
  hora_fin_real: zTime.optional(),
  estado: zString(20).optional(),
  modalidad: nullableOptional(zString(30)),
  detalle_temas_revisados: nullableOptional(zString(200)),
  observaciones: nullableOptional(zString(300)),
  motivo_cancelacion: nullableOptional(zString(200)),
  id_usuario: nullableOptional(zId), // FK/id
};

const claseCursoCreateSchema = z.object(claseCursoCreateShape).strict();
const claseCursoUpdateSchema = nonEmptyUpdate(z.object(claseCursoUpdateShape).strict().partial());

const claseCursoIdSchema = z.object({
  id_clase_curso: zId,
}).strict();

const claseCursoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  claseCursoCreateSchema,
  claseCursoUpdateSchema,
  claseCursoIdSchema,
  claseCursoQuerySchema,
  createSchema: claseCursoCreateSchema,
  updateSchema: claseCursoUpdateSchema,
  idSchema: claseCursoIdSchema,
  querySchema: claseCursoQuerySchema,
};
