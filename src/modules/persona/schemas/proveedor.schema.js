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

// Schema: persona.proveedor
// Campos omitidos del body por recomendación: id_proveedor, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const proveedorCreateShape = {
  nombre_proveedor: zString(180),
  categoria: nullableOptional(zString(100)),
  telefono: nullableOptional(zPhone(100)),
};

const proveedorUpdateShape = {
  nombre_proveedor: zString(180).optional(),
  categoria: nullableOptional(zString(100)),
  telefono: nullableOptional(zPhone(100)),
};

const proveedorCreateSchema = z.object(proveedorCreateShape).strict();
const proveedorUpdateSchema = nonEmptyUpdate(z.object(proveedorUpdateShape).strict().partial());

const proveedorIdSchema = z.object({
  id_proveedor: zId,
}).strict();

const proveedorQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  proveedorCreateSchema,
  proveedorUpdateSchema,
  proveedorIdSchema,
  proveedorQuerySchema,
  createSchema: proveedorCreateSchema,
  updateSchema: proveedorUpdateSchema,
  idSchema: proveedorIdSchema,
  querySchema: proveedorQuerySchema,
};
