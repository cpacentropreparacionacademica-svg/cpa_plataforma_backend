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

// Schema: contabilidad.centro_costo
// Campos omitidos del body por recomendación: id_centro_costo, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const centroCostoCreateShape = {
  codigo: zCode(40),
  nombre: zString(150),
  id_cuenta_ingreso: nullableOptional(zId), // FK/id
  id_cuenta_costo: nullableOptional(zId), // FK/id
  observaciones: nullableOptional(zText),
};

const centroCostoUpdateShape = {
  codigo: zCode(40).optional(),
  nombre: zString(150).optional(),
  id_cuenta_ingreso: nullableOptional(zId), // FK/id
  id_cuenta_costo: nullableOptional(zId), // FK/id
  observaciones: nullableOptional(zText),
};

const centroCostoCreateSchema = z.object(centroCostoCreateShape).strict();
const centroCostoUpdateSchema = nonEmptyUpdate(z.object(centroCostoUpdateShape).strict().partial());

const centroCostoIdSchema = z.object({
  id_centro_costo: zId,
}).strict();

const centroCostoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  centroCostoCreateSchema,
  centroCostoUpdateSchema,
  centroCostoIdSchema,
  centroCostoQuerySchema,
  createSchema: centroCostoCreateSchema,
  updateSchema: centroCostoUpdateSchema,
  idSchema: centroCostoIdSchema,
  querySchema: centroCostoQuerySchema,
};
