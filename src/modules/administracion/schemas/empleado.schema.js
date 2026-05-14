const { z } = require("zod");
const {
  zId,
  zString,
  zEmail,
  zPhone,
  zDateOnly,
  nullableOptional,
  nonEmptyUpdate,
  listQuerySchema,
} = require("../../../shared/validation/zod.helpers");

const {
  personaCreateSchema,
  personaUpdateSchema,
} = require("../../persona/schemas/persona.schema");

// Schema compuesto: persona.persona + administracion.empleado.
const empleadoDataCreateShape = {
  fecha_ingreso: zDateOnly,
  fecha_salida: nullableOptional(zDateOnly),
  tipo_contrato: z.enum(["INDEFINIDO", "PLAZO_FIJO", "HONORARIOS"]).optional(),
  jornada: z.enum(["FULL_TIME", "PART_TIME"]).optional(),
  email_corporativo: nullableOptional(zEmail(200)),
  telefono_corporativo: nullableOptional(zPhone(100)),
  id_sucursal: nullableOptional(zId),
};

const empleadoDataUpdateShape = {
  fecha_ingreso: zDateOnly.optional(),
  fecha_salida: nullableOptional(zDateOnly),
  tipo_contrato: z.enum(["INDEFINIDO", "PLAZO_FIJO", "HONORARIOS"]).optional(),
  jornada: z.enum(["FULL_TIME", "PART_TIME"]).optional(),
  email_corporativo: nullableOptional(zEmail(200)),
  telefono_corporativo: nullableOptional(zPhone(100)),
  id_sucursal: nullableOptional(zId),
};

const empleadoDataCreateSchema = z.object(empleadoDataCreateShape).strict();
const empleadoDataUpdateSchema = nonEmptyUpdate(z.object(empleadoDataUpdateShape).strict().partial());

const empleadoCreateSchema = z.object({
  persona: personaCreateSchema,
  empleado: empleadoDataCreateSchema,
}).strict();

const empleadoUpdateSchema = nonEmptyUpdate(z.object({
  persona: personaUpdateSchema.optional(),
  empleado: empleadoDataUpdateSchema.optional(),
}).strict());

const empleadoIdSchema = z.object({
  id_empleado: zId,
}).strict();

const empleadoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
  id_sucursal: zId.optional(),
}).strip();

module.exports = {
  empleadoDataCreateSchema,
  empleadoDataUpdateSchema,
  empleadoCreateSchema,
  empleadoUpdateSchema,
  empleadoIdSchema,
  empleadoQuerySchema,
  createSchema: empleadoCreateSchema,
  updateSchema: empleadoUpdateSchema,
  idSchema: empleadoIdSchema,
  querySchema: empleadoQuerySchema,
};
