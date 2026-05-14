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

// Schema: seguridad.permiso
// Campos omitidos del body por recomendación: id_permiso, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const permisoCreateShape = {
  codigo: zText,
  descripcion: nullableOptional(zText),
  modulo: nullableOptional(zText),
};

const permisoUpdateShape = {
  codigo: zText.optional(),
  descripcion: nullableOptional(zText),
  modulo: nullableOptional(zText),
};

const permisoCreateSchema = z.object(permisoCreateShape).strict();
const permisoUpdateSchema = nonEmptyUpdate(z.object(permisoUpdateShape).strict().partial());

const permisoIdSchema = z.object({
  id_permiso: zId,
}).strict();

const permisoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  permisoCreateSchema,
  permisoUpdateSchema,
  permisoIdSchema,
  permisoQuerySchema,
  createSchema: permisoCreateSchema,
  updateSchema: permisoUpdateSchema,
  idSchema: permisoIdSchema,
  querySchema: permisoQuerySchema,
};
