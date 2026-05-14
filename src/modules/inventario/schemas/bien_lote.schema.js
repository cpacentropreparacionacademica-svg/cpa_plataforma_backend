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

// Schema: inventario.bien_lote
// Campos omitidos del body por recomendación: id_lote, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const bienLoteCreateShape = {
  id_bien: zId, // FK/id
  lote_codigo: zCode(80),
  fecha_compra: zDateOnly,
  id_proveedor_compra: nullableOptional(zInt), // FK/id
  cantidad_compra: zInt,
  costo_compra_unitario: nullableOptional(zDecimal(18, 4)),
  precio_compra_unitario: nullableOptional(zDecimal(18, 2)),
  fecha_fabricacion: nullableOptional(zDateOnly),
  fecha_vencimiento: nullableOptional(zDateOnly),
};

const bienLoteUpdateShape = {
  id_bien: zId.optional(), // FK/id
  lote_codigo: zCode(80).optional(),
  fecha_compra: zDateOnly.optional(),
  id_proveedor_compra: nullableOptional(zInt), // FK/id
  cantidad_compra: zInt.optional(),
  costo_compra_unitario: nullableOptional(zDecimal(18, 4)),
  precio_compra_unitario: nullableOptional(zDecimal(18, 2)),
  fecha_fabricacion: nullableOptional(zDateOnly),
  fecha_vencimiento: nullableOptional(zDateOnly),
};

const bienLoteCreateSchema = z.object(bienLoteCreateShape).strict();
const bienLoteUpdateSchema = nonEmptyUpdate(z.object(bienLoteUpdateShape).strict().partial());

const bienLoteIdSchema = z.object({
  id_lote: zId,
}).strict();

const bienLoteQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  bienLoteCreateSchema,
  bienLoteUpdateSchema,
  bienLoteIdSchema,
  bienLoteQuerySchema,
  createSchema: bienLoteCreateSchema,
  updateSchema: bienLoteUpdateSchema,
  idSchema: bienLoteIdSchema,
  querySchema: bienLoteQuerySchema,
};
