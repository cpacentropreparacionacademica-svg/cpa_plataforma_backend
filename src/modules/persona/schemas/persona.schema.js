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

// Schema: persona.persona
// Campos omitidos del body por recomendación: id_persona, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const personaCreateShape = {
  nombres: zString(100),
  apellidos: nullableOptional(zString(100)),
  telefono: nullableOptional(zPhone(100)),
  fecha_nacimiento: nullableOptional(zDateOnly),
  email: nullableOptional(zEmail(200)),
};

const personaUpdateShape = {
  nombres: zString(100).optional(),
  apellidos: nullableOptional(zString(100)),
  telefono: nullableOptional(zPhone(100)),
  fecha_nacimiento: nullableOptional(zDateOnly),
  email: nullableOptional(zEmail(200)),
};

const personaCreateSchema = z.object(personaCreateShape).strict();
const personaUpdateSchema = nonEmptyUpdate(z.object(personaUpdateShape).strict().partial());

const personaIdSchema = z.object({
  id_persona: zId,
}).strict();

const personaQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  personaCreateSchema,
  personaUpdateSchema,
  personaIdSchema,
  personaQuerySchema,
  createSchema: personaCreateSchema,
  updateSchema: personaUpdateSchema,
  idSchema: personaIdSchema,
  querySchema: personaQuerySchema,
};
