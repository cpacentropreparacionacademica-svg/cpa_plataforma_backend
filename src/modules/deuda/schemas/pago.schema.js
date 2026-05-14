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

// Schema: deuda.pago
// Campos omitidos del body por recomendación: id_pago, fecha_modificacion, version_registro.
const pagoCreateShape = {
  id_deuda: zId, // FK/id
  fecha_pago: zDateOnly.optional(),
  interes_pagado: nullableOptional(zDecimal(18, 2)),
  capital_amortizado: nullableOptional(zDecimal(18, 2)),
  seguro_desgravamen_pagado: nullableOptional(zDecimal(18, 2)),
  otros_recargos_pagados: nullableOptional(zDecimal(18, 2)),
  observaciones: nullableOptional(zText),
};

const pagoUpdateShape = {
  id_deuda: zId.optional(), // FK/id
  fecha_pago: zDateOnly.optional(),
  interes_pagado: nullableOptional(zDecimal(18, 2)),
  capital_amortizado: nullableOptional(zDecimal(18, 2)),
  seguro_desgravamen_pagado: nullableOptional(zDecimal(18, 2)),
  otros_recargos_pagados: nullableOptional(zDecimal(18, 2)),
  observaciones: nullableOptional(zText),
};

const pagoCreateSchema = z.object(pagoCreateShape).strict();
const pagoUpdateSchema = nonEmptyUpdate(z.object(pagoUpdateShape).strict().partial());

const pagoIdSchema = z.object({
  id_pago: zId,
}).strict();

const pagoQuerySchema = listQuerySchema.extend({
}).strip();

module.exports = {
  pagoCreateSchema,
  pagoUpdateSchema,
  pagoIdSchema,
  pagoQuerySchema,
  createSchema: pagoCreateSchema,
  updateSchema: pagoUpdateSchema,
  idSchema: pagoIdSchema,
  querySchema: pagoQuerySchema,
};
