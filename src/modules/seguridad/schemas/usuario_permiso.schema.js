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

// Schema: seguridad.usuario_permiso
// Campos omitidos del body por recomendación: fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const usuarioPermisoCreateShape = {
  id_persona: zId, // FK/id
  id_permiso: zId, // FK/id
  permitido: zBoolean.optional(),
};

const usuarioPermisoUpdateShape = {
  permitido: zBoolean.optional(),
};

const usuarioPermisoCreateSchema = z.object(usuarioPermisoCreateShape).strict();
const usuarioPermisoUpdateSchema = nonEmptyUpdate(z.object(usuarioPermisoUpdateShape).strict().partial());

const usuarioPermisoIdSchema = z.object({
  id_persona: zId,
  id_permiso: zId,
}).strict();

const usuarioPermisoQuerySchema = listQuerySchema.extend({
}).strip();

module.exports = {
  usuarioPermisoCreateSchema,
  usuarioPermisoUpdateSchema,
  usuarioPermisoIdSchema,
  usuarioPermisoQuerySchema,
  createSchema: usuarioPermisoCreateSchema,
  updateSchema: usuarioPermisoUpdateSchema,
  idSchema: usuarioPermisoIdSchema,
  querySchema: usuarioPermisoQuerySchema,
};
