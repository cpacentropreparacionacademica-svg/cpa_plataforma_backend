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

// Schema: societario.emision_titulo
// Campos omitidos del body por recomendación: id_emision, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const emisionTituloCreateShape = {
  id_clase_titulo: zId, // FK/id
  ronda: nullableOptional(z.enum(["FOUNDERS", "ANGEL", "SEED", "A", "B", "C", "D", "PUENTE", "OTRA"])), // enum
  instrumento: z.enum(["AUMENTO_CAPITAL", "CONVERSION", "PLAN_OPCIONES", "EMISION_SECUNDARIA", "OTRO"]).optional(), // enum
  serie: nullableOptional(zString(30)),
  fecha_emision: zDateOnly,
  cantidad_autorizada: zDecimal(28, 6),
  cantidad_emitida: zDecimal(28, 6),
  precio_emision: nullableOptional(zDecimal(18, 6)),
  observaciones: nullableOptional(zText),
};

const emisionTituloUpdateShape = {
  id_clase_titulo: zId.optional(), // FK/id
  ronda: nullableOptional(z.enum(["FOUNDERS", "ANGEL", "SEED", "A", "B", "C", "D", "PUENTE", "OTRA"])), // enum
  instrumento: z.enum(["AUMENTO_CAPITAL", "CONVERSION", "PLAN_OPCIONES", "EMISION_SECUNDARIA", "OTRO"]).optional(), // enum
  serie: nullableOptional(zString(30)),
  fecha_emision: zDateOnly.optional(),
  cantidad_autorizada: zDecimal(28, 6).optional(),
  cantidad_emitida: zDecimal(28, 6).optional(),
  precio_emision: nullableOptional(zDecimal(18, 6)),
  observaciones: nullableOptional(zText),
};

const emisionTituloCreateSchema = z.object(emisionTituloCreateShape).strict();
const emisionTituloUpdateSchema = nonEmptyUpdate(z.object(emisionTituloUpdateShape).strict().partial());

const emisionTituloIdSchema = z.object({
  id_emision: zId,
}).strict();

const emisionTituloQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  emisionTituloCreateSchema,
  emisionTituloUpdateSchema,
  emisionTituloIdSchema,
  emisionTituloQuerySchema,
  createSchema: emisionTituloCreateSchema,
  updateSchema: emisionTituloUpdateSchema,
  idSchema: emisionTituloIdSchema,
  querySchema: emisionTituloQuerySchema,
};
