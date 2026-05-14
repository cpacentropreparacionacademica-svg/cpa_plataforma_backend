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

// Schema: contabilidad.archivos_transaccion
// Campos omitidos del body por recomendación: id_archivo, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const archivosTransaccionCreateShape = {
  id_transaccion: zId, // FK/id
  link_achivo: zText,
  link_archivo: nullableOptional(zText),
};

const archivosTransaccionUpdateShape = {
  id_transaccion: zId.optional(), // FK/id
  link_achivo: zText.optional(),
  link_archivo: nullableOptional(zText),
};

const archivosTransaccionCreateSchema = z.object(archivosTransaccionCreateShape).strict();
const archivosTransaccionUpdateSchema = nonEmptyUpdate(z.object(archivosTransaccionUpdateShape).strict().partial());

const archivosTransaccionIdSchema = z.object({
  id_archivo: zId,
}).strict();

const archivosTransaccionQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  archivosTransaccionCreateSchema,
  archivosTransaccionUpdateSchema,
  archivosTransaccionIdSchema,
  archivosTransaccionQuerySchema,
  createSchema: archivosTransaccionCreateSchema,
  updateSchema: archivosTransaccionUpdateSchema,
  idSchema: archivosTransaccionIdSchema,
  querySchema: archivosTransaccionQuerySchema,
};
