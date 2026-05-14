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

// Schema: persona.estudiante_padre
// Campos omitidos del body por recomendación: id_asociacion, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const estudiantePadreCreateShape = {
  id_padre: zId, // FK/id
  id_estudiante: zId, // FK/id
};

const estudiantePadreUpdateShape = {
  id_padre: zId.optional(), // FK/id
  id_estudiante: zId.optional(), // FK/id
};

const estudiantePadreCreateSchema = z.object(estudiantePadreCreateShape).strict();
const estudiantePadreUpdateSchema = nonEmptyUpdate(z.object(estudiantePadreUpdateShape).strict().partial());

const estudiantePadreIdSchema = z.object({
  id_asociacion: zId,
}).strict();

const estudiantePadreQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  estudiantePadreCreateSchema,
  estudiantePadreUpdateSchema,
  estudiantePadreIdSchema,
  estudiantePadreQuerySchema,
  createSchema: estudiantePadreCreateSchema,
  updateSchema: estudiantePadreUpdateSchema,
  idSchema: estudiantePadreIdSchema,
  querySchema: estudiantePadreQuerySchema,
};
