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

// Schema: seguridad.action_log
// Campos omitidos del body por recomendación: id_action, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const actionLogCreateShape = {
  id_sesion: zId, // FK/id
  tipo_accion: zText,
  severidad: zText.optional(),
  entity_schema: nullableOptional(zText),
  entity_table: nullableOptional(zText),
  entity_pk: nullableOptional(zJson),
  user_agent: nullableOptional(zText),
  metadata: zJson.optional(),
  success: zBoolean.optional(),
};

const actionLogUpdateShape = {
  id_sesion: zId.optional(), // FK/id
  tipo_accion: zText.optional(),
  severidad: zText.optional(),
  entity_schema: nullableOptional(zText),
  entity_table: nullableOptional(zText),
  entity_pk: nullableOptional(zJson),
  user_agent: nullableOptional(zText),
  metadata: zJson.optional(),
  success: zBoolean.optional(),
};

const actionLogCreateSchema = z.object(actionLogCreateShape).strict();
const actionLogUpdateSchema = nonEmptyUpdate(z.object(actionLogUpdateShape).strict().partial());

const actionLogIdSchema = z.object({
  id_action: zId,
}).strict();

const actionLogQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  actionLogCreateSchema,
  actionLogUpdateSchema,
  actionLogIdSchema,
  actionLogQuerySchema,
  createSchema: actionLogCreateSchema,
  updateSchema: actionLogUpdateSchema,
  idSchema: actionLogIdSchema,
  querySchema: actionLogQuerySchema,
};
