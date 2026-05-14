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

// Schema: inventario.bien_instancia
// Campos omitidos del body por recomendación: id_bien_instancia, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const bienInstanciaCreateShape = {
  id_bien: zId, // FK/id
  descripcion_especificaciones: zText,
  fecha_compra: zDateOnly,
  id_proveedor_compra: nullableOptional(zInt), // FK/id
  costo_compra: nullableOptional(zDecimal(18, 4)),
  precio_compra: nullableOptional(zDecimal(18, 2)),
  serial_unico: nullableOptional(zString(120)),
  fecha_fabricacion: nullableOptional(zDateOnly),
  fecha_vencimiento: nullableOptional(zDateOnly),
};

const bienInstanciaUpdateShape = {
  id_bien: zId.optional(), // FK/id
  descripcion_especificaciones: zText.optional(),
  fecha_compra: zDateOnly.optional(),
  id_proveedor_compra: nullableOptional(zInt), // FK/id
  costo_compra: nullableOptional(zDecimal(18, 4)),
  precio_compra: nullableOptional(zDecimal(18, 2)),
  serial_unico: nullableOptional(zString(120)),
  fecha_fabricacion: nullableOptional(zDateOnly),
  fecha_vencimiento: nullableOptional(zDateOnly),
};

const bienInstanciaCreateSchema = z.object(bienInstanciaCreateShape).strict();
const bienInstanciaUpdateSchema = nonEmptyUpdate(z.object(bienInstanciaUpdateShape).strict().partial());

const bienInstanciaIdSchema = z.object({
  id_bien_instancia: zId,
}).strict();

const bienInstanciaQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  bienInstanciaCreateSchema,
  bienInstanciaUpdateSchema,
  bienInstanciaIdSchema,
  bienInstanciaQuerySchema,
  createSchema: bienInstanciaCreateSchema,
  updateSchema: bienInstanciaUpdateSchema,
  idSchema: bienInstanciaIdSchema,
  querySchema: bienInstanciaQuerySchema,
};
