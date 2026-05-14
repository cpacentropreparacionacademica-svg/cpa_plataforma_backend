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

// Schema: societario.transferencia_titulo
// Campos omitidos del body por recomendación: id_transferencia, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const transferenciaTituloCreateShape = {
  id_emision: zId, // FK/id
  id_titular_origen: zId, // FK/id
  id_titular_destino: zId, // FK/id
  cantidad: zDecimal(28, 6),
  precio_unitario: nullableOptional(zDecimal(18, 6)),
  fecha_transferencia: zDateOnly,
  motivo: nullableOptional(zText),
};

const transferenciaTituloUpdateShape = {
  id_emision: zId.optional(), // FK/id
  id_titular_origen: zId.optional(), // FK/id
  id_titular_destino: zId.optional(), // FK/id
  cantidad: zDecimal(28, 6).optional(),
  precio_unitario: nullableOptional(zDecimal(18, 6)),
  fecha_transferencia: zDateOnly.optional(),
  motivo: nullableOptional(zText),
};

const transferenciaTituloCreateSchema = z.object(transferenciaTituloCreateShape).strict();
const transferenciaTituloUpdateSchema = nonEmptyUpdate(z.object(transferenciaTituloUpdateShape).strict().partial());

const transferenciaTituloIdSchema = z.object({
  id_transferencia: zId,
}).strict();

const transferenciaTituloQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  transferenciaTituloCreateSchema,
  transferenciaTituloUpdateSchema,
  transferenciaTituloIdSchema,
  transferenciaTituloQuerySchema,
  createSchema: transferenciaTituloCreateSchema,
  updateSchema: transferenciaTituloUpdateSchema,
  idSchema: transferenciaTituloIdSchema,
  querySchema: transferenciaTituloQuerySchema,
};
