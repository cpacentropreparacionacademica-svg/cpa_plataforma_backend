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

// Schema: persona.persona_padre
// Campos omitidos del body por recomendación: id_padre, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const personaPadreCreateShape = {
  es_embajador: nullableOptional(zBoolean),
  metadata: nullableOptional(zJson),
};

const personaPadreUpdateShape = {
  es_embajador: nullableOptional(zBoolean),
  metadata: nullableOptional(zJson),
};

const personaPadreCreateSchema = z.object(personaPadreCreateShape).strict();
const personaPadreUpdateSchema = nonEmptyUpdate(z.object(personaPadreUpdateShape).strict().partial());

const personaPadreIdSchema = z.object({
  id_padre: zId,
}).strict();

const personaPadreQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  personaPadreCreateSchema,
  personaPadreUpdateSchema,
  personaPadreIdSchema,
  personaPadreQuerySchema,
  createSchema: personaPadreCreateSchema,
  updateSchema: personaPadreUpdateSchema,
  idSchema: personaPadreIdSchema,
  querySchema: personaPadreQuerySchema,
};
