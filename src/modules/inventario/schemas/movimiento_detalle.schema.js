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

// Schema: inventario.movimiento_detalle
// Campos omitidos del body por recomendación: id_movimiento.
const movimientoDetalleCreateShape = {
  id_bien: zId, // FK/id
  id_lote: nullableOptional(zId), // FK/id
  id_bien_instancia: nullableOptional(zId), // FK/id
  cantidad: zDecimal(18, 6).optional(),
  id_espacio_entrada: nullableOptional(zId), // FK/id
  id_espacio_salida: nullableOptional(zId), // FK/id
};

const movimientoDetalleUpdateShape = {
  id_bien: zId.optional(), // FK/id
  id_lote: nullableOptional(zId), // FK/id
  id_bien_instancia: nullableOptional(zId), // FK/id
  cantidad: zDecimal(18, 6).optional(),
  id_espacio_entrada: nullableOptional(zId), // FK/id
  id_espacio_salida: nullableOptional(zId), // FK/id
};

const movimientoDetalleCreateSchema = z.object(movimientoDetalleCreateShape).strict();
const movimientoDetalleUpdateSchema = nonEmptyUpdate(z.object(movimientoDetalleUpdateShape).strict().partial());

const movimientoDetalleIdSchema = z.object({
  id_movimiento: zId,
}).strict();

const movimientoDetalleQuerySchema = listQuerySchema.extend({
}).strip();

module.exports = {
  movimientoDetalleCreateSchema,
  movimientoDetalleUpdateSchema,
  movimientoDetalleIdSchema,
  movimientoDetalleQuerySchema,
  createSchema: movimientoDetalleCreateSchema,
  updateSchema: movimientoDetalleUpdateSchema,
  idSchema: movimientoDetalleIdSchema,
  querySchema: movimientoDetalleQuerySchema,
};
