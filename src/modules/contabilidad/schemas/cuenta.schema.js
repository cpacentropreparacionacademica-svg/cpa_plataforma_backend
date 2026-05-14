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

// Schema: contabilidad.cuenta
// Campos omitidos del body por recomendación: id_cuenta, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const cuentaCreateShape = {
  codigo: zCode(40),
  nombre_cuenta: zString(180),
  id_grupo_cuenta: zId, // FK/id
};

const cuentaUpdateShape = {
  codigo: zCode(40).optional(),
  nombre_cuenta: zString(180).optional(),
  id_grupo_cuenta: zId.optional(), // FK/id
};

const cuentaCreateSchema = z.object(cuentaCreateShape).strict();
const cuentaUpdateSchema = nonEmptyUpdate(z.object(cuentaUpdateShape).strict().partial());

const cuentaIdSchema = z.object({
  id_cuenta: zId,
}).strict();

const cuentaQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  cuentaCreateSchema,
  cuentaUpdateSchema,
  cuentaIdSchema,
  cuentaQuerySchema,
  createSchema: cuentaCreateSchema,
  updateSchema: cuentaUpdateSchema,
  idSchema: cuentaIdSchema,
  querySchema: cuentaQuerySchema,
};
