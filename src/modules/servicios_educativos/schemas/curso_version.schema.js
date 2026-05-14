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

// Schema: servicios_educativos.curso_version
// Campos omitidos del body por recomendación: id_curso_version, fecha_registro, estado_registro, id_usuario_modificacion, version_registro.
const cursoVersionCreateShape = {
  id_producto_educativo: zId, // FK/id
  nombre_version: zString(150),
  descripcion_version: nullableOptional(zText),
  fecha_inicio: nullableOptional(zDateOnly),
  fecha_fin: nullableOptional(zDateOnly),
  precio_version: nullableOptional(zDecimal(12, 2)),
  id_horario: nullableOptional(zInt), // FK/id
  id_usuario: nullableOptional(zId), // FK/id
};

const cursoVersionUpdateShape = {
  id_producto_educativo: zId.optional(), // FK/id
  nombre_version: zString(150).optional(),
  descripcion_version: nullableOptional(zText),
  fecha_inicio: nullableOptional(zDateOnly),
  fecha_fin: nullableOptional(zDateOnly),
  precio_version: nullableOptional(zDecimal(12, 2)),
  id_horario: nullableOptional(zInt), // FK/id
  id_usuario: nullableOptional(zId), // FK/id
};

const cursoVersionCreateSchema = z.object(cursoVersionCreateShape).strict();
const cursoVersionUpdateSchema = nonEmptyUpdate(z.object(cursoVersionUpdateShape).strict().partial());

const cursoVersionIdSchema = z.object({
  id_curso_version: zId,
}).strict();

const cursoVersionQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  cursoVersionCreateSchema,
  cursoVersionUpdateSchema,
  cursoVersionIdSchema,
  cursoVersionQuerySchema,
  createSchema: cursoVersionCreateSchema,
  updateSchema: cursoVersionUpdateSchema,
  idSchema: cursoVersionIdSchema,
  querySchema: cursoVersionQuerySchema,
};
