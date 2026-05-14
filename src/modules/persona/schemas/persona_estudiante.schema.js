const { z } = require("zod");
const {
  zId,
  zSmallInt,
  zString,
  zCode,
  nullableOptional,
  nonEmptyUpdate,
  listQuerySchema,
} = require("../../../shared/validation/zod.helpers");

const {
  personaCreateSchema,
  personaUpdateSchema,
} = require("./persona.schema");

// Schema compuesto: persona.persona + persona.persona_estudiante
// El cliente ya no debe crear primero persona y luego estudiante.
// El backend crea primero persona y luego persona_estudiante usando el id_persona generado.
const estudianteCreateShape = {
  codigo_estudiante: nullableOptional(zCode(50)),
  id_unidad_educativa: nullableOptional(zId),
  tipo: nullableOptional(zString(50)),
  nivel_actual: nullableOptional(zString(50)),
  curso_actual: nullableOptional(zString(50)),
  turno_actual: nullableOptional(zString(50)),
  carrera: nullableOptional(zString(100)),
  anio_ingreso: nullableOptional(zSmallInt),
  id_usuario: nullableOptional(zId),
};

const estudianteUpdateShape = {
  codigo_estudiante: nullableOptional(zCode(50)),
  id_unidad_educativa: nullableOptional(zId),
  tipo: nullableOptional(zString(50)),
  nivel_actual: nullableOptional(zString(50)),
  curso_actual: nullableOptional(zString(50)),
  turno_actual: nullableOptional(zString(50)),
  carrera: nullableOptional(zString(100)),
  anio_ingreso: nullableOptional(zSmallInt),
  id_usuario: nullableOptional(zId),
};

const estudianteCreateSchema = z.object(estudianteCreateShape).strict();
const estudianteUpdateSchema = nonEmptyUpdate(z.object(estudianteUpdateShape).strict().partial());

const personaEstudianteCreateSchema = z.object({
  persona: personaCreateSchema,
  estudiante: estudianteCreateSchema,
}).strict();

const personaEstudianteUpdateSchema = nonEmptyUpdate(z.object({
  persona: personaUpdateSchema.optional(),
  estudiante: estudianteUpdateSchema.optional(),
}).strict());

const personaEstudianteIdSchema = z.object({
  id_persona: zId,
}).strict();

const personaEstudianteQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  estudianteCreateSchema,
  estudianteUpdateSchema,
  personaEstudianteCreateSchema,
  personaEstudianteUpdateSchema,
  personaEstudianteIdSchema,
  personaEstudianteQuerySchema,
  createSchema: personaEstudianteCreateSchema,
  updateSchema: personaEstudianteUpdateSchema,
  idSchema: personaEstudianteIdSchema,
  querySchema: personaEstudianteQuerySchema,
};
