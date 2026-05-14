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

// Schema: seguridad.sesion
// Campos omitidos del body por recomendación: id_sesion.
const sesionCreateShape = {
  id_persona: zId, // FK/id
  ip_acceso: nullableOptional(zText),
  user_agent: nullableOptional(zText),
  tipo_login: nullableOptional(zText),
  tipo_logout: nullableOptional(zText),
  timestamp_login: zDateTime.optional(),
  timestamp_logout: nullableOptional(zDateTime),
  esta_activa: zBoolean.optional(),
  metadata: zJson.optional(),
};

const sesionUpdateShape = {
  id_persona: zId.optional(), // FK/id
  ip_acceso: nullableOptional(zText),
  user_agent: nullableOptional(zText),
  tipo_login: nullableOptional(zText),
  tipo_logout: nullableOptional(zText),
  timestamp_login: zDateTime.optional(),
  timestamp_logout: nullableOptional(zDateTime),
  esta_activa: zBoolean.optional(),
  metadata: zJson.optional(),
};

const sesionCreateSchema = z.object(sesionCreateShape).strict();
const sesionUpdateSchema = nonEmptyUpdate(z.object(sesionUpdateShape).strict().partial());

const sesionIdSchema = z.object({
  id_sesion: zId,
}).strict();

const sesionQuerySchema = listQuerySchema.extend({
}).strip();

module.exports = {
  sesionCreateSchema,
  sesionUpdateSchema,
  sesionIdSchema,
  sesionQuerySchema,
  createSchema: sesionCreateSchema,
  updateSchema: sesionUpdateSchema,
  idSchema: sesionIdSchema,
  querySchema: sesionQuerySchema,
};
