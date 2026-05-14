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

// Schema: contabilidad.pago_tutor_detalle
// Campos omitidos del body por recomendación: id_pago_tutor_detalle.
const pagoTutorDetalleCreateShape = {
  id_pago_tutor: zId, // FK/id
  id_clase: zId, // FK/id
  horas_pasadas: zInt,
  tarifa_hora_aplicada: zDecimal(12, 2),
};

const pagoTutorDetalleUpdateShape = {
  id_pago_tutor: zId.optional(), // FK/id
  id_clase: zId.optional(), // FK/id
  horas_pasadas: zInt.optional(),
  tarifa_hora_aplicada: zDecimal(12, 2).optional(),
};

const pagoTutorDetalleCreateSchema = z.object(pagoTutorDetalleCreateShape).strict();
const pagoTutorDetalleUpdateSchema = nonEmptyUpdate(z.object(pagoTutorDetalleUpdateShape).strict().partial());

const pagoTutorDetalleIdSchema = z.object({
  id_pago_tutor_detalle: zId,
}).strict();

const pagoTutorDetalleQuerySchema = listQuerySchema.extend({
}).strip();

module.exports = {
  pagoTutorDetalleCreateSchema,
  pagoTutorDetalleUpdateSchema,
  pagoTutorDetalleIdSchema,
  pagoTutorDetalleQuerySchema,
  createSchema: pagoTutorDetalleCreateSchema,
  updateSchema: pagoTutorDetalleUpdateSchema,
  idSchema: pagoTutorDetalleIdSchema,
  querySchema: pagoTutorDetalleQuerySchema,
};
