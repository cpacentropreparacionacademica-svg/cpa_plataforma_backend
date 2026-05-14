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

// Schema: seguridad.rol
// Campos omitidos del body por recomendación: id_rol, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const rolCreateShape = {
  codigo: zText,
  nombre: zText,
  descripcion: nullableOptional(zText),
};

const rolUpdateShape = {
  codigo: zText.optional(),
  nombre: zText.optional(),
  descripcion: nullableOptional(zText),
};

const rolCreateSchema = z.object(rolCreateShape).strict();
const rolUpdateSchema = nonEmptyUpdate(z.object(rolUpdateShape).strict().partial());

const rolIdSchema = z.object({
  id_rol: zId,
}).strict();

const rolQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  rolCreateSchema,
  rolUpdateSchema,
  rolIdSchema,
  rolQuerySchema,
  createSchema: rolCreateSchema,
  updateSchema: rolUpdateSchema,
  idSchema: rolIdSchema,
  querySchema: rolQuerySchema,
};
