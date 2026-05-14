const { z } = require("zod");
const {
  zId,
  zBoolean,
  zString,
  zText,
  nullableOptional,
  nonEmptyUpdate,
  listQuerySchema,
} = require("../../../shared/validation/zod.helpers");

const {
  personaCreateSchema,
  personaUpdateSchema,
} = require("../../persona/schemas/persona.schema");

// Schema compuesto: persona.persona + societario.titular.
const titularDataCreateShape = {
  es_beneficial_owner: nullableOptional(zBoolean),
  observaciones: nullableOptional(zText),
};

const titularDataUpdateShape = {
  es_beneficial_owner: nullableOptional(zBoolean),
  observaciones: nullableOptional(zText),
};

const titularDataCreateSchema = z.object(titularDataCreateShape).strict();
const titularDataUpdateSchema = nonEmptyUpdate(z.object(titularDataUpdateShape).strict().partial());

const titularCreateSchema = z.object({
  persona: personaCreateSchema,
  titular: titularDataCreateSchema,
}).strict();

const titularUpdateSchema = nonEmptyUpdate(z.object({
  persona: personaUpdateSchema.optional(),
  titular: titularDataUpdateSchema.optional(),
}).strict());

const titularIdSchema = z.object({
  id_titular: zId,
}).strict();

const titularQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  titularDataCreateSchema,
  titularDataUpdateSchema,
  titularCreateSchema,
  titularUpdateSchema,
  titularIdSchema,
  titularQuerySchema,
  createSchema: titularCreateSchema,
  updateSchema: titularUpdateSchema,
  idSchema: titularIdSchema,
  querySchema: titularQuerySchema,
};
