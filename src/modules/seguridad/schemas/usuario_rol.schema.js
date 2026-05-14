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

// Schema: seguridad.usuario_rol
// Campos omitidos del body por recomendación: fecha_registro, estado_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const usuarioRolCreateShape = {
  id_persona: zId, // FK/id
  id_rol: zId, // FK/id
};

const usuarioRolUpdateShape = {
};

const usuarioRolCreateSchema = z.object(usuarioRolCreateShape).strict();
const usuarioRolUpdateSchema = nonEmptyUpdate(z.object(usuarioRolUpdateShape).strict().partial());

const usuarioRolIdSchema = z.object({
  id_persona: zId,
  id_rol: zId,
}).strict();

const usuarioRolQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  usuarioRolCreateSchema,
  usuarioRolUpdateSchema,
  usuarioRolIdSchema,
  usuarioRolQuerySchema,
  createSchema: usuarioRolCreateSchema,
  updateSchema: usuarioRolUpdateSchema,
  idSchema: usuarioRolIdSchema,
  querySchema: usuarioRolQuerySchema,
};
