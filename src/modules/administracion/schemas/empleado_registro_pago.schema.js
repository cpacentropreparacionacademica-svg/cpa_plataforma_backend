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

// Schema: administracion.empleado_registro_pago
const empleadoRegistroPagoCreateShape = {
  fecha_pago: zDateOnly,
  haber_basico_pagado: zNumeric.optional(),
  comisiones_totales_pagadas: zNumeric.optional(),
  aguinaldos_totales_pagados: zNumeric.optional(),
  indemnizacion_total_pagada: zNumeric.optional(),
  otros_cargos_pagados: zNumeric.optional(),
  descripcion_otros_cargos_pagados: nullableOptional(zText),
  notas_pago: nullableOptional(zText),
};

const empleadoRegistroPagoUpdateShape = {
  fecha_pago: zDateOnly.optional(),
  haber_basico_pagado: zNumeric.optional(),
  comisiones_totales_pagadas: zNumeric.optional(),
  aguinaldos_totales_pagados: zNumeric.optional(),
  indemnizacion_total_pagada: zNumeric.optional(),
  otros_cargos_pagados: zNumeric.optional(),
  descripcion_otros_cargos_pagados: nullableOptional(zText),
  notas_pago: nullableOptional(zText),
};

const empleadoRegistroPagoCreateSchema = z.object(empleadoRegistroPagoCreateShape).strict();
const empleadoRegistroPagoUpdateSchema = nonEmptyUpdate(z.object(empleadoRegistroPagoUpdateShape).strict().partial());

const empleadoRegistroPagoIdSchema = z.object({
  id_pago: zId,
}).strict();

const empleadoRegistroPagoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  empleadoRegistroPagoCreateSchema,
  empleadoRegistroPagoUpdateSchema,
  empleadoRegistroPagoIdSchema,
  empleadoRegistroPagoQuerySchema,
  createSchema: empleadoRegistroPagoCreateSchema,
  updateSchema: empleadoRegistroPagoUpdateSchema,
  idSchema: empleadoRegistroPagoIdSchema,
  querySchema: empleadoRegistroPagoQuerySchema,
};
