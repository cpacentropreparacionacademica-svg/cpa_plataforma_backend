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

// Schema: societario.dividendo_pago
// Campos omitidos del body por recomendación: id_dividendo_pago, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const dividendoPagoCreateShape = {
  id_dividendo: zId, // FK/id
  id_titular: zId, // FK/id
  monto_pagado: zDecimal(18, 6),
  fecha_pago_real: nullableOptional(zDateOnly),
};

const dividendoPagoUpdateShape = {
  id_dividendo: zId.optional(), // FK/id
  id_titular: zId.optional(), // FK/id
  monto_pagado: zDecimal(18, 6).optional(),
  fecha_pago_real: nullableOptional(zDateOnly),
};

const dividendoPagoCreateSchema = z.object(dividendoPagoCreateShape).strict();
const dividendoPagoUpdateSchema = nonEmptyUpdate(z.object(dividendoPagoUpdateShape).strict().partial());

const dividendoPagoIdSchema = z.object({
  id_dividendo_pago: zId,
}).strict();

const dividendoPagoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  dividendoPagoCreateSchema,
  dividendoPagoUpdateSchema,
  dividendoPagoIdSchema,
  dividendoPagoQuerySchema,
  createSchema: dividendoPagoCreateSchema,
  updateSchema: dividendoPagoUpdateSchema,
  idSchema: dividendoPagoIdSchema,
  querySchema: dividendoPagoQuerySchema,
};
