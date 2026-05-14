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

// Schema: deuda.deuda
// Campos omitidos del body por recomendación: id_deuda, fecha_modificacion, version_registro.
const deudaCreateShape = {
  id_proveedor: zId, // FK/id
  monto_inicial: zDecimal(18, 2),
  tasa_anual: zDecimal(6, 4),
  tipo_tasa: zString(20),
  capitalizacion: nullableOptional(zString(20)),
  plazo_meses: zInt,
  seguro_desgravamen_fijo: nullableOptional(zDecimal(18, 2)),
  seguro_desgravamen_variable: nullableOptional(zDecimal(18, 2)),
  tipo_calculo_cuotas: zString(10).optional(),
  frecuencia_cuotas: zString().optional(),
  tipo_pago: zString(20).optional(),
  tipo_primer_pago: zString(20).optional(),
  anualidad_acordada: nullableOptional(zDecimal(18, 2)),
  fecha_inicio: zDateOnly.optional(),
  observaciones: nullableOptional(zText),
};

const deudaUpdateShape = {
  id_proveedor: zId.optional(), // FK/id
  monto_inicial: zDecimal(18, 2).optional(),
  tasa_anual: zDecimal(6, 4).optional(),
  tipo_tasa: zString(20).optional(),
  capitalizacion: nullableOptional(zString(20)),
  plazo_meses: zInt.optional(),
  seguro_desgravamen_fijo: nullableOptional(zDecimal(18, 2)),
  seguro_desgravamen_variable: nullableOptional(zDecimal(18, 2)),
  tipo_calculo_cuotas: zString(10).optional(),
  frecuencia_cuotas: zString().optional(),
  tipo_pago: zString(20).optional(),
  tipo_primer_pago: zString(20).optional(),
  anualidad_acordada: nullableOptional(zDecimal(18, 2)),
  fecha_inicio: zDateOnly.optional(),
  observaciones: nullableOptional(zText),
};

const deudaCreateSchema = z.object(deudaCreateShape).strict();
const deudaUpdateSchema = nonEmptyUpdate(z.object(deudaUpdateShape).strict().partial());

const deudaIdSchema = z.object({
  id_deuda: zId,
}).strict();

const deudaQuerySchema = listQuerySchema.extend({
}).strip();

module.exports = {
  deudaCreateSchema,
  deudaUpdateSchema,
  deudaIdSchema,
  deudaQuerySchema,
  createSchema: deudaCreateSchema,
  updateSchema: deudaUpdateSchema,
  idSchema: deudaIdSchema,
  querySchema: deudaQuerySchema,
};
