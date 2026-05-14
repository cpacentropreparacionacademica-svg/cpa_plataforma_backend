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

// Schema: persona.unidad_educativa
// Campos omitidos del body por recomendación: id_unidad_educativa, fecha_registro, id_usuario_modificacion, version_registro, estado_registro, fecha_modificacion.
const unidadEducativaCreateShape = {
  nombre: zString(150),
  latitud: nullableOptional(zDecimal(9, 6)),
  longitud: nullableOptional(zDecimal(9, 6)),
  categoria: zString(20),
  id_usuario: nullableOptional(zId), // FK/id
};

const unidadEducativaUpdateShape = {
  nombre: zString(150).optional(),
  latitud: nullableOptional(zDecimal(9, 6)),
  longitud: nullableOptional(zDecimal(9, 6)),
  categoria: zString(20).optional(),
  id_usuario: nullableOptional(zId), // FK/id
};

const unidadEducativaCreateSchema = z.object(unidadEducativaCreateShape).strict();
const unidadEducativaUpdateSchema = nonEmptyUpdate(z.object(unidadEducativaUpdateShape).strict().partial());

const unidadEducativaIdSchema = z.object({
  id_unidad_educativa: zId,
}).strict();

const unidadEducativaQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  unidadEducativaCreateSchema,
  unidadEducativaUpdateSchema,
  unidadEducativaIdSchema,
  unidadEducativaQuerySchema,
  createSchema: unidadEducativaCreateSchema,
  updateSchema: unidadEducativaUpdateSchema,
  idSchema: unidadEducativaIdSchema,
  querySchema: unidadEducativaQuerySchema,
};
