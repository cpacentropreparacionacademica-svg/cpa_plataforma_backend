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

// Schema: contabilidad.concepto_costo
// Campos omitidos del body por recomendación: id_concepto, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const conceptoCostoCreateShape = {
  codigo: zCode(50),
  nombre: zString(160),
  tipo_concepto: zString(15),
  unidad_medida: nullableOptional(zString(20)),
};

const conceptoCostoUpdateShape = {
  codigo: zCode(50).optional(),
  nombre: zString(160).optional(),
  tipo_concepto: zString(15).optional(),
  unidad_medida: nullableOptional(zString(20)),
};

const conceptoCostoCreateSchema = z.object(conceptoCostoCreateShape).strict();
const conceptoCostoUpdateSchema = nonEmptyUpdate(z.object(conceptoCostoUpdateShape).strict().partial());

const conceptoCostoIdSchema = z.object({
  id_concepto: zId,
}).strict();

const conceptoCostoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  conceptoCostoCreateSchema,
  conceptoCostoUpdateSchema,
  conceptoCostoIdSchema,
  conceptoCostoQuerySchema,
  createSchema: conceptoCostoCreateSchema,
  updateSchema: conceptoCostoUpdateSchema,
  idSchema: conceptoCostoIdSchema,
  querySchema: conceptoCostoQuerySchema,
};
