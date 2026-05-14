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

// Schema: administracion.kpi
// Campos omitidos del body por recomendación: id_kpi, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const kpiCreateShape = {
  nombre: zString(150),
  descripcion: nullableOptional(zText),
  unidad_medida: zString(50),
  frecuencia: nullableOptional(zString(30)),
};

const kpiUpdateShape = {
  nombre: zString(150).optional(),
  descripcion: nullableOptional(zText),
  unidad_medida: zString(50).optional(),
  frecuencia: nullableOptional(zString(30)),
};

const kpiCreateSchema = z.object(kpiCreateShape).strict();
const kpiUpdateSchema = nonEmptyUpdate(z.object(kpiUpdateShape).strict().partial());

const kpiIdSchema = z.object({
  id_kpi: zId,
}).strict();

const kpiQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  kpiCreateSchema,
  kpiUpdateSchema,
  kpiIdSchema,
  kpiQuerySchema,
  createSchema: kpiCreateSchema,
  updateSchema: kpiUpdateSchema,
  idSchema: kpiIdSchema,
  querySchema: kpiQuerySchema,
};
