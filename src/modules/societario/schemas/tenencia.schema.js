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

// Schema: societario.tenencia
// Campos omitidos del body por recomendación: id_tenencia, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const tenenciaCreateShape = {
  id_emision: zId, // FK/id
  id_titular: zId, // FK/id
  cantidad: zDecimal(28, 6),
  fecha_adquisicion: zDateOnly,
  origen: z.enum(["EMISION", "TRANSFERENCIA", "CONVERSION", "EJERCICIO_OPCION", "AJUSTE"]).optional(), // enum
  es_nominativa: nullableOptional(zBoolean),
  observaciones: nullableOptional(zText),
};

const tenenciaUpdateShape = {
  id_emision: zId.optional(), // FK/id
  id_titular: zId.optional(), // FK/id
  cantidad: zDecimal(28, 6).optional(),
  fecha_adquisicion: zDateOnly.optional(),
  origen: z.enum(["EMISION", "TRANSFERENCIA", "CONVERSION", "EJERCICIO_OPCION", "AJUSTE"]).optional(), // enum
  es_nominativa: nullableOptional(zBoolean),
  observaciones: nullableOptional(zText),
};

const tenenciaCreateSchema = z.object(tenenciaCreateShape).strict();
const tenenciaUpdateSchema = nonEmptyUpdate(z.object(tenenciaUpdateShape).strict().partial());

const tenenciaIdSchema = z.object({
  id_tenencia: zId,
}).strict();

const tenenciaQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  tenenciaCreateSchema,
  tenenciaUpdateSchema,
  tenenciaIdSchema,
  tenenciaQuerySchema,
  createSchema: tenenciaCreateSchema,
  updateSchema: tenenciaUpdateSchema,
  idSchema: tenenciaIdSchema,
  querySchema: tenenciaQuerySchema,
};
