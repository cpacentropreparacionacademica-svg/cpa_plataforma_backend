const { z } = require("zod");
const {
  zId,
  zNumeric,
  zString,
  nonEmptyUpdate,
  listQuerySchema,
} = require("../../../shared/validation/zod.helpers");

// Schema: contabilidad.transaccion_movimiento_cuenta
// Creación por batch: el endpoint POST espera { movimientos: [...] }.
const transaccionMovimientoCuentaItemCreateShape = {
  id_transaccion: zId,
  id_cuenta: zId,
  debe: zNumeric.optional(),
  haber: zNumeric.optional(),
};

const transaccionMovimientoCuentaUpdateShape = {
  id_transaccion: zId.optional(),
  id_cuenta: zId.optional(),
  debe: zNumeric.optional(),
  haber: zNumeric.optional(),
};

const transaccionMovimientoCuentaItemCreateSchema = z
  .object(transaccionMovimientoCuentaItemCreateShape)
  .strict();

const transaccionMovimientoCuentaCreateSchema = z.object({
  movimientos: z
    .array(transaccionMovimientoCuentaItemCreateSchema)
    .min(1, "Debe enviar al menos un movimiento de cuenta."),
}).strict();

const transaccionMovimientoCuentaUpdateSchema = nonEmptyUpdate(
  z.object(transaccionMovimientoCuentaUpdateShape).strict().partial()
);

const transaccionMovimientoCuentaIdSchema = z.object({
  id_movimiento: zId,
}).strict();

const transaccionMovimientoCuentaQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  transaccionMovimientoCuentaItemCreateSchema,
  transaccionMovimientoCuentaCreateSchema,
  transaccionMovimientoCuentaUpdateSchema,
  transaccionMovimientoCuentaIdSchema,
  transaccionMovimientoCuentaQuerySchema,
  createSchema: transaccionMovimientoCuentaCreateSchema,
  updateSchema: transaccionMovimientoCuentaUpdateSchema,
  idSchema: transaccionMovimientoCuentaIdSchema,
  querySchema: transaccionMovimientoCuentaQuerySchema,
};
