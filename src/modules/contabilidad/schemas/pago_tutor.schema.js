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

// Schema: contabilidad.pago_tutor
// Campos omitidos del body por recomendación: id_pago_tutor, fecha_registro, fecha_modificacion, estado_registro, version_registro.
const pagoTutorCreateShape = {
  id_tutor: zId, // FK/id
  periodo_inicio: zDateTime,
  periodo_fin: nullableOptional(zDateTime),
  estado_pago: zText.optional(),
  subtotal: zDecimal(12, 2).optional(),
  ajustes: zDecimal(12, 2).optional(),
  total: zDecimal(12, 2).optional(),
  fecha_aprobacion: nullableOptional(zDateTime),
  fecha_pago: nullableOptional(zDateTime),
  referencia_pago: nullableOptional(zText),
  observacion: nullableOptional(zText),
};

const pagoTutorUpdateShape = {
  id_tutor: zId.optional(), // FK/id
  periodo_inicio: zDateTime.optional(),
  periodo_fin: nullableOptional(zDateTime),
  estado_pago: zText.optional(),
  subtotal: zDecimal(12, 2).optional(),
  ajustes: zDecimal(12, 2).optional(),
  total: zDecimal(12, 2).optional(),
  fecha_aprobacion: nullableOptional(zDateTime),
  fecha_pago: nullableOptional(zDateTime),
  referencia_pago: nullableOptional(zText),
  observacion: nullableOptional(zText),
};

const pagoTutorCreateSchema = z.object(pagoTutorCreateShape).strict();
const pagoTutorUpdateSchema = nonEmptyUpdate(z.object(pagoTutorUpdateShape).strict().partial());

const pagoTutorIdSchema = z.object({
  id_pago_tutor: zId,
}).strict();

const pagoTutorQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  pagoTutorCreateSchema,
  pagoTutorUpdateSchema,
  pagoTutorIdSchema,
  pagoTutorQuerySchema,
  createSchema: pagoTutorCreateSchema,
  updateSchema: pagoTutorUpdateSchema,
  idSchema: pagoTutorIdSchema,
  querySchema: pagoTutorQuerySchema,
};
