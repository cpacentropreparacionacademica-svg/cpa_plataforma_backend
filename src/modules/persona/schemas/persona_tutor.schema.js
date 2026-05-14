const { z } = require("zod");
const {
  zId,
  zDecimal,
  zString,
  nullableOptional,
  nonEmptyUpdate,
  listQuerySchema,
} = require("../../../shared/validation/zod.helpers");

const {
  personaCreateSchema,
  personaUpdateSchema,
} = require("./persona.schema");

// Schema compuesto: persona.persona + persona.persona_tutor.
const tutorCreateShape = {
  pago_por_hora: zDecimal(12, 2),
  nivel_experiencia: zString(20),
  tipo_estudiante_especialidad: zString(20),
  nivel_estudiante_especialidad: nullableOptional(zString(20)),
  id_usuario: nullableOptional(zId),
};

const tutorUpdateShape = {
  pago_por_hora: zDecimal(12, 2).optional(),
  nivel_experiencia: zString(20).optional(),
  tipo_estudiante_especialidad: zString(20).optional(),
  nivel_estudiante_especialidad: nullableOptional(zString(20)),
  id_usuario: nullableOptional(zId),
};

const tutorCreateSchema = z.object(tutorCreateShape).strict();
const tutorUpdateSchema = nonEmptyUpdate(z.object(tutorUpdateShape).strict().partial());

const personaTutorCreateSchema = z.object({
  persona: personaCreateSchema,
  tutor: tutorCreateSchema,
}).strict();

const personaTutorUpdateSchema = nonEmptyUpdate(z.object({
  persona: personaUpdateSchema.optional(),
  tutor: tutorUpdateSchema.optional(),
}).strict());

const personaTutorIdSchema = z.object({
  id_tutor: zId,
}).strict();

const personaTutorQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  tutorCreateSchema,
  tutorUpdateSchema,
  personaTutorCreateSchema,
  personaTutorUpdateSchema,
  personaTutorIdSchema,
  personaTutorQuerySchema,
  createSchema: personaTutorCreateSchema,
  updateSchema: personaTutorUpdateSchema,
  idSchema: personaTutorIdSchema,
  querySchema: personaTutorQuerySchema,
};
