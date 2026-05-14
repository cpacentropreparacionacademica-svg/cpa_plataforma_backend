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

// Schema: servicios_educativos.paquetes_producto_educativo
// Campos omitidos del body por recomendación: id_paquete, fecha_registro, estado_registro, id_usuario_modificacion, version_registro, fecha_modificacion.
const paquetesProductoEducativoCreateShape = {
  nombre_paquete: zString(150),
  cantidad_horas_paquete: zInt.optional(),
  precio_paquete: zDecimal(12, 2),
  id_usuario: nullableOptional(zId), // FK/id
};

const paquetesProductoEducativoUpdateShape = {
  nombre_paquete: zString(150).optional(),
  cantidad_horas_paquete: zInt.optional(),
  precio_paquete: zDecimal(12, 2).optional(),
  id_usuario: nullableOptional(zId), // FK/id
};

const paquetesProductoEducativoCreateSchema = z.object(paquetesProductoEducativoCreateShape).strict();
const paquetesProductoEducativoUpdateSchema = nonEmptyUpdate(z.object(paquetesProductoEducativoUpdateShape).strict().partial());

const paquetesProductoEducativoIdSchema = z.object({
  id_paquete: zId,
}).strict();

const paquetesProductoEducativoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  paquetesProductoEducativoCreateSchema,
  paquetesProductoEducativoUpdateSchema,
  paquetesProductoEducativoIdSchema,
  paquetesProductoEducativoQuerySchema,
  createSchema: paquetesProductoEducativoCreateSchema,
  updateSchema: paquetesProductoEducativoUpdateSchema,
  idSchema: paquetesProductoEducativoIdSchema,
  querySchema: paquetesProductoEducativoQuerySchema,
};
