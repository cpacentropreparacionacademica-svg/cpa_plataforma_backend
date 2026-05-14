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

// Schema: societario.dividendo
// Campos omitidos del body por recomendación: id_dividendo, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const dividendoCreateShape = {
  id_clase_titulo: zId, // FK/id
  fecha_declaracion: zDateOnly,
  fecha_pago: nullableOptional(zDateOnly),
  monto_total: zDecimal(18, 6),
  observaciones: nullableOptional(zText),
};

const dividendoUpdateShape = {
  id_clase_titulo: zId.optional(), // FK/id
  fecha_declaracion: zDateOnly.optional(),
  fecha_pago: nullableOptional(zDateOnly),
  monto_total: zDecimal(18, 6).optional(),
  observaciones: nullableOptional(zText),
};

const dividendoCreateSchema = z.object(dividendoCreateShape).strict();
const dividendoUpdateSchema = nonEmptyUpdate(z.object(dividendoUpdateShape).strict().partial());

const dividendoIdSchema = z.object({
  id_dividendo: zId,
}).strict();

const dividendoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  dividendoCreateSchema,
  dividendoUpdateSchema,
  dividendoIdSchema,
  dividendoQuerySchema,
  createSchema: dividendoCreateSchema,
  updateSchema: dividendoUpdateSchema,
  idSchema: dividendoIdSchema,
  querySchema: dividendoQuerySchema,
};
