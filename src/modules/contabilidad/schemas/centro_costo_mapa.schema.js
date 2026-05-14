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

// Schema: contabilidad.centro_costo_mapa
// Campos omitidos del body por recomendación: id_cc_mapa, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const centroCostoMapaCreateShape = {
  id_centro_costo: zId, // FK/id
  tipo: z.enum(["DIRECTO", "INDIRECTO"]), // enum
  naturaleza: z.enum(["FIJO", "VARIABLE"]), // enum
  vigente_desde: zDateOnly.optional(),
  vigente_hasta: nullableOptional(zDateOnly),
  id_deuda: nullableOptional(zId), // FK/id
  id_bien: nullableOptional(zId), // FK/id
  id_sucursal: nullableOptional(zId), // FK/id
  id_tienda: nullableOptional(zId), // FK/id
  id_empleado: nullableOptional(zId), // FK/id
  id_posicion: nullableOptional(zId), // FK/id
  id_departamento: nullableOptional(zId), // FK/id
};

const centroCostoMapaUpdateShape = {
  id_centro_costo: zId.optional(), // FK/id
  tipo: z.enum(["DIRECTO", "INDIRECTO"]).optional(), // enum
  naturaleza: z.enum(["FIJO", "VARIABLE"]).optional(), // enum
  vigente_desde: zDateOnly.optional(),
  vigente_hasta: nullableOptional(zDateOnly),
  id_deuda: nullableOptional(zId), // FK/id
  id_bien: nullableOptional(zId), // FK/id
  id_sucursal: nullableOptional(zId), // FK/id
  id_tienda: nullableOptional(zId), // FK/id
  id_empleado: nullableOptional(zId), // FK/id
  id_posicion: nullableOptional(zId), // FK/id
  id_departamento: nullableOptional(zId), // FK/id
};

const centroCostoMapaCreateSchema = z.object(centroCostoMapaCreateShape).strict();
const centroCostoMapaUpdateSchema = nonEmptyUpdate(z.object(centroCostoMapaUpdateShape).strict().partial());

const centroCostoMapaIdSchema = z.object({
  id_cc_mapa: zId,
}).strict();

const centroCostoMapaQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
  id_sucursal: zId.optional(),
}).strip();

module.exports = {
  centroCostoMapaCreateSchema,
  centroCostoMapaUpdateSchema,
  centroCostoMapaIdSchema,
  centroCostoMapaQuerySchema,
  createSchema: centroCostoMapaCreateSchema,
  updateSchema: centroCostoMapaUpdateSchema,
  idSchema: centroCostoMapaIdSchema,
  querySchema: centroCostoMapaQuerySchema,
};
