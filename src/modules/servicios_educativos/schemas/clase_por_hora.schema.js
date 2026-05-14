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

// Schema: servicios_educativos.clase_por_hora
// Campos omitidos del body por recomendación: id_clase, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const clasePorHoraCreateShape = {
  id_aula: zInt, // FK/id
  id_estudiante: zInt, // FK/id
  id_tutor: zInt, // FK/id
  id_materia_tree: zInt, // FK/id
  hora_llegada: zDateTime,
  motivo: zText,
  modalidad: zText.optional(),
  hora_salida: nullableOptional(zDateTime),
  estado_operativo: zText.optional(),
};

const clasePorHoraUpdateShape = {
  id_aula: zInt.optional(), // FK/id
  id_estudiante: zInt.optional(), // FK/id
  id_tutor: zInt.optional(), // FK/id
  id_materia_tree: zInt.optional(), // FK/id
  hora_llegada: zDateTime.optional(),
  motivo: zText.optional(),
  modalidad: zText.optional(),
  hora_salida: nullableOptional(zDateTime),
  estado_operativo: zText.optional(),
};

const clasePorHoraCreateSchema = z.object(clasePorHoraCreateShape).strict();
const clasePorHoraUpdateSchema = nonEmptyUpdate(z.object(clasePorHoraUpdateShape).strict().partial());

const clasePorHoraIdSchema = z.object({
  id_clase: zId,
}).strict();

const clasePorHoraQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  clasePorHoraCreateSchema,
  clasePorHoraUpdateSchema,
  clasePorHoraIdSchema,
  clasePorHoraQuerySchema,
  createSchema: clasePorHoraCreateSchema,
  updateSchema: clasePorHoraUpdateSchema,
  idSchema: clasePorHoraIdSchema,
  querySchema: clasePorHoraQuerySchema,
};
