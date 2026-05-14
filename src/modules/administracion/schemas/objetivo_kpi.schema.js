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

// Schema: administracion.objetivo_kpi
// Campos omitidos del body por recomendación: id_objetivo_kpi, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const objetivoKpiCreateShape = {
  id_kpi: zId, // FK/id
  periodo: zString(30),
  valor_meta: zDecimal(18, 4),
  valor_minimo: nullableOptional(zDecimal(18, 4)),
  valor_maximo: nullableOptional(zDecimal(18, 4)),
  responsable: nullableOptional(zInt),
  id_sucursal: nullableOptional(zInt), // FK/id
  id_tienda: nullableOptional(zInt), // FK/id
  id_producto: nullableOptional(zInt), // FK/id
  id_producto_tienda: nullableOptional(zInt), // FK/id
  cumplido: nullableOptional(zBoolean),
};

const objetivoKpiUpdateShape = {
  id_kpi: zId.optional(), // FK/id
  periodo: zString(30).optional(),
  valor_meta: zDecimal(18, 4).optional(),
  valor_minimo: nullableOptional(zDecimal(18, 4)),
  valor_maximo: nullableOptional(zDecimal(18, 4)),
  responsable: nullableOptional(zInt),
  id_sucursal: nullableOptional(zInt), // FK/id
  id_tienda: nullableOptional(zInt), // FK/id
  id_producto: nullableOptional(zInt), // FK/id
  id_producto_tienda: nullableOptional(zInt), // FK/id
  cumplido: nullableOptional(zBoolean),
};

const objetivoKpiCreateSchema = z.object(objetivoKpiCreateShape).strict();
const objetivoKpiUpdateSchema = nonEmptyUpdate(z.object(objetivoKpiUpdateShape).strict().partial());

const objetivoKpiIdSchema = z.object({
  id_objetivo_kpi: zId,
}).strict();

const objetivoKpiQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
  id_sucursal: zId.optional(),
}).strip();

module.exports = {
  objetivoKpiCreateSchema,
  objetivoKpiUpdateSchema,
  objetivoKpiIdSchema,
  objetivoKpiQuerySchema,
  createSchema: objetivoKpiCreateSchema,
  updateSchema: objetivoKpiUpdateSchema,
  idSchema: objetivoKpiIdSchema,
  querySchema: objetivoKpiQuerySchema,
};
