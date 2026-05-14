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

// Schema: servicios_educativos.materia_tree
// Campos omitidos del body por recomendación: id_tree, fecha_registro, id_usuario_modificacion, version_registro, estado_registro, fecha_modificacion.
const materiaTreeCreateShape = {
  nombre: zString(100),
  tema: zString(100),
  subtema: zString(100),
  id_usuario: nullableOptional(zId), // FK/id
};

const materiaTreeUpdateShape = {
  nombre: zString(100).optional(),
  tema: zString(100).optional(),
  subtema: zString(100).optional(),
  id_usuario: nullableOptional(zId), // FK/id
};

const materiaTreeCreateSchema = z.object(materiaTreeCreateShape).strict();
const materiaTreeUpdateSchema = nonEmptyUpdate(z.object(materiaTreeUpdateShape).strict().partial());

const materiaTreeIdSchema = z.object({
  id_tree: zId,
}).strict();

const materiaTreeQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  materiaTreeCreateSchema,
  materiaTreeUpdateSchema,
  materiaTreeIdSchema,
  materiaTreeQuerySchema,
  createSchema: materiaTreeCreateSchema,
  updateSchema: materiaTreeUpdateSchema,
  idSchema: materiaTreeIdSchema,
  querySchema: materiaTreeQuerySchema,
};
