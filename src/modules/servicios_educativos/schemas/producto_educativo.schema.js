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

// Schema: servicios_educativos.producto_educativo
// Campos omitidos del body por recomendación: id_producto_educativo, fecha_registro, estado_registro, id_usuario_modificacion, version_registro, fecha_modificacion.
const productoEducativoCreateShape = {
  nombre: zString(150),
  descripcion: nullableOptional(zText),
  tipo_producto: zString(50),
  precio_base: nullableOptional(zDecimal(12, 2)),
  lim_sup_estudiantes: zInt.optional(),
  lim_inf_estudiantes: zInt.optional(),
  id_producto_tienda: nullableOptional(zInt), // FK/id
  link_bibliografia: nullableOptional(zText),
  link_publicidad: nullableOptional(zText),
  id_usuario: nullableOptional(zId), // FK/id
};

const productoEducativoUpdateShape = {
  nombre: zString(150).optional(),
  descripcion: nullableOptional(zText),
  tipo_producto: zString(50).optional(),
  precio_base: nullableOptional(zDecimal(12, 2)),
  lim_sup_estudiantes: zInt.optional(),
  lim_inf_estudiantes: zInt.optional(),
  id_producto_tienda: nullableOptional(zInt), // FK/id
  link_bibliografia: nullableOptional(zText),
  link_publicidad: nullableOptional(zText),
  id_usuario: nullableOptional(zId), // FK/id
};

const productoEducativoCreateSchema = z.object(productoEducativoCreateShape).strict();
const productoEducativoUpdateSchema = nonEmptyUpdate(z.object(productoEducativoUpdateShape).strict().partial());

const productoEducativoIdSchema = z.object({
  id_producto_educativo: zId,
}).strict();

const productoEducativoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  productoEducativoCreateSchema,
  productoEducativoUpdateSchema,
  productoEducativoIdSchema,
  productoEducativoQuerySchema,
  createSchema: productoEducativoCreateSchema,
  updateSchema: productoEducativoUpdateSchema,
  idSchema: productoEducativoIdSchema,
  querySchema: productoEducativoQuerySchema,
};
