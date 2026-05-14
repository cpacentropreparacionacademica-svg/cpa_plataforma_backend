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

// Schema: seguridad.rol_permiso
// Campos omitidos del body por recomendación: fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const rolPermisoCreateShape = {
  id_rol: zId, // FK/id
  id_permiso: zId, // FK/id
};

const rolPermisoUpdateShape = {
};

const rolPermisoCreateSchema = z.object(rolPermisoCreateShape).strict();
const rolPermisoUpdateSchema = nonEmptyUpdate(z.object(rolPermisoUpdateShape).strict().partial());

const rolPermisoIdSchema = z.object({
  id_rol: zId,
  id_permiso: zId,
}).strict();

const rolPermisoQuerySchema = listQuerySchema.extend({
}).strip();

module.exports = {
  rolPermisoCreateSchema,
  rolPermisoUpdateSchema,
  rolPermisoIdSchema,
  rolPermisoQuerySchema,
  createSchema: rolPermisoCreateSchema,
  updateSchema: rolPermisoUpdateSchema,
  idSchema: rolPermisoIdSchema,
  querySchema: rolPermisoQuerySchema,
};
