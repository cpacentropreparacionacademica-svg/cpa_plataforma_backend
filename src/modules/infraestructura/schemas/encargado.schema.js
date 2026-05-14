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

// Schema: infraestructura.encargado
// Campos omitidos del body por recomendación: id_asignacion, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const encargadoCreateShape = {
  id_sucursal: zInt, // FK/id
  id_empleado: zInt, // FK/id
  fecha_inicio: zDateOnly,
  fecha_fin: nullableOptional(zDateOnly),
};

const encargadoUpdateShape = {
  id_sucursal: zInt.optional(), // FK/id
  id_empleado: zInt.optional(), // FK/id
  fecha_inicio: zDateOnly.optional(),
  fecha_fin: nullableOptional(zDateOnly),
};

const encargadoCreateSchema = z.object(encargadoCreateShape).strict();
const encargadoUpdateSchema = nonEmptyUpdate(z.object(encargadoUpdateShape).strict().partial());

const encargadoIdSchema = z.object({
  id_asignacion: zId,
}).strict();

const encargadoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
  id_sucursal: zId.optional(),
}).strip();

module.exports = {
  encargadoCreateSchema,
  encargadoUpdateSchema,
  encargadoIdSchema,
  encargadoQuerySchema,
  createSchema: encargadoCreateSchema,
  updateSchema: encargadoUpdateSchema,
  idSchema: encargadoIdSchema,
  querySchema: encargadoQuerySchema,
};
