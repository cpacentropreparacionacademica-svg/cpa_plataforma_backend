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

// Schema: administracion.empleado_posicion_pago
const empleadoPosicionPagoCreateShape = {
  id_empleado: zId, // FK/id
  id_posicion: zId, // FK/id
  vigente_desde: zDateOnly.optional(),
  vigente_hasta: nullableOptional(zDateOnly),
  tipo_esquema_pago: z.enum(["SUELDO", "POR_HORA", "COMISION", "MIXTO"]), // enum
  frecuencia_pago: z.enum(["MENSUAL", "QUINCENAL", "SEMANAL"]).optional(), // enum
  moneda: nullableOptional(zString(3)),
  pago_por_hora: nullableOptional(zDecimal(18, 2)),
  sueldo_mensual: nullableOptional(zDecimal(18, 2)),
  porcentaje_comision: nullableOptional(zDecimal(5, 2)),
  comision_fija: nullableOptional(zDecimal(18, 2)),
  tipo_comisionable: nullableOptional(zText),
  tipo_calculo_comisionable: nullableOptional(zText),
};

const empleadoPosicionPagoUpdateShape = {
  id_empleado: zId.optional(), // FK/id
  id_posicion: zId.optional(), // FK/id
  vigente_desde: zDateOnly.optional(),
  vigente_hasta: nullableOptional(zDateOnly),
  tipo_esquema_pago: z.enum(["SUELDO", "POR_HORA", "COMISION", "MIXTO"]).optional(), // enum
  frecuencia_pago: z.enum(["MENSUAL", "QUINCENAL", "SEMANAL"]).optional(), // enum
  moneda: nullableOptional(zString(3)),
  pago_por_hora: nullableOptional(zDecimal(18, 2)),
  sueldo_mensual: nullableOptional(zDecimal(18, 2)),
  porcentaje_comision: nullableOptional(zDecimal(5, 2)),
  comision_fija: nullableOptional(zDecimal(18, 2)),
  tipo_comisionable: nullableOptional(zText),
  tipo_calculo_comisionable: nullableOptional(zText),
};

const empleadoPosicionPagoCreateSchema = z.object(empleadoPosicionPagoCreateShape).strict();
const empleadoPosicionPagoUpdateSchema = nonEmptyUpdate(z.object(empleadoPosicionPagoUpdateShape).strict().partial());

const empleadoPosicionPagoIdSchema = z.object({
  id_empleado_posicion: zId,
}).strict();

const empleadoPosicionPagoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  empleadoPosicionPagoCreateSchema,
  empleadoPosicionPagoUpdateSchema,
  empleadoPosicionPagoIdSchema,
  empleadoPosicionPagoQuerySchema,
  createSchema: empleadoPosicionPagoCreateSchema,
  updateSchema: empleadoPosicionPagoUpdateSchema,
  idSchema: empleadoPosicionPagoIdSchema,
  querySchema: empleadoPosicionPagoQuerySchema,
};
