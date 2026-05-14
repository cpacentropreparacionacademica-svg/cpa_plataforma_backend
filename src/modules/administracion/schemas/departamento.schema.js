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

// Schema: administracion.departamento
const departamentoCreateShape = {
  codigo: zCode(30),
  nombre: zString(120),
  descripcion_funciones: nullableOptional(zString(240)),
  id_departamento_padre: nullableOptional(zId), // FK/id
  id_sucursal: nullableOptional(zId), // FK/id
  id_jefe_empleado: nullableOptional(zId), // FK/id
  es_activo: zBoolean.optional(),
  fecha_inicio: nullableOptional(zDateOnly),
  fecha_fin: nullableOptional(zDateOnly),
};

const departamentoUpdateShape = {
  codigo: zCode(30).optional(),
  nombre: zString(120).optional(),
  descripcion_funciones: nullableOptional(zString(240)),
  id_departamento_padre: nullableOptional(zId), // FK/id
  id_sucursal: nullableOptional(zId), // FK/id
  id_jefe_empleado: nullableOptional(zId), // FK/id
  es_activo: zBoolean.optional(),
  fecha_inicio: nullableOptional(zDateOnly),
  fecha_fin: nullableOptional(zDateOnly),
};

const departamentoCreateSchema = z.object(departamentoCreateShape).strict();
const departamentoUpdateSchema = nonEmptyUpdate(z.object(departamentoUpdateShape).strict().partial());

const departamentoIdSchema = z.object({
  id_departamento: zId,
}).strict();

const departamentoQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
  es_activo: zBoolean.optional(),
  id_sucursal: zId.optional(),
}).strip();

module.exports = {
  departamentoCreateSchema,
  departamentoUpdateSchema,
  departamentoIdSchema,
  departamentoQuerySchema,
  createSchema: departamentoCreateSchema,
  updateSchema: departamentoUpdateSchema,
  idSchema: departamentoIdSchema,
  querySchema: departamentoQuerySchema,
};
