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

// Schema: contabilidad.grupo_cuenta
// Campos omitidos del body por recomendación: id_grupo_cuenta, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const grupoCuentaCreateShape = {
  codigo: zCode(30),
  nombre: zString(150),
  id_parent: nullableOptional(zId), // FK/id
  tipo: zString(15),
  sub_tipo: zString(15),
  sub_grupo: nullableOptional(zString(20)),
  orden_reporte: nullableOptional(zSmallInt),
};

const grupoCuentaUpdateShape = {
  codigo: zCode(30).optional(),
  nombre: zString(150).optional(),
  id_parent: nullableOptional(zId), // FK/id
  tipo: zString(15).optional(),
  sub_tipo: zString(15).optional(),
  sub_grupo: nullableOptional(zString(20)),
  orden_reporte: nullableOptional(zSmallInt),
};

const grupoCuentaCreateSchema = z.object(grupoCuentaCreateShape).strict();
const grupoCuentaUpdateSchema = nonEmptyUpdate(z.object(grupoCuentaUpdateShape).strict().partial());

const grupoCuentaIdSchema = z.object({
  id_grupo_cuenta: zId,
}).strict();

const grupoCuentaQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  grupoCuentaCreateSchema,
  grupoCuentaUpdateSchema,
  grupoCuentaIdSchema,
  grupoCuentaQuerySchema,
  createSchema: grupoCuentaCreateSchema,
  updateSchema: grupoCuentaUpdateSchema,
  idSchema: grupoCuentaIdSchema,
  querySchema: grupoCuentaQuerySchema,
};
