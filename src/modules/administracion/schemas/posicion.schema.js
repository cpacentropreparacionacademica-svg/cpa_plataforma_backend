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

// Schema: administracion.posicion
// Campos omitidos del body por recomendación: id_posicion, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const posicionCreateShape = {
  codigo: zCode(40),
  nombre: zString(150),
  id_posicion_parent: nullableOptional(zId), // FK/id
  descripcion: nullableOptional(zText),
};

const posicionUpdateShape = {
  codigo: zCode(40).optional(),
  nombre: zString(150).optional(),
  id_posicion_parent: nullableOptional(zId), // FK/id
  descripcion: nullableOptional(zText),
};

const posicionCreateSchema = z.object(posicionCreateShape).strict();
const posicionUpdateSchema = nonEmptyUpdate(z.object(posicionUpdateShape).strict().partial());

const posicionIdSchema = z.object({
  id_posicion: zId,
}).strict();

const posicionQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  posicionCreateSchema,
  posicionUpdateSchema,
  posicionIdSchema,
  posicionQuerySchema,
  createSchema: posicionCreateSchema,
  updateSchema: posicionUpdateSchema,
  idSchema: posicionIdSchema,
  querySchema: posicionQuerySchema,
};
