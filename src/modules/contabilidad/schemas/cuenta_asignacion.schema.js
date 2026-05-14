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

// Schema: contabilidad.cuenta_asignacion
// Campos omitidos del body por recomendación: id_cuenta_asignacion, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const cuentaAsignacionCreateShape = {
  entidad_tipo: zText,
  id_empleado: nullableOptional(zId), // FK/id
  id_persona_estudiante: nullableOptional(zId), // FK/id
  id_persona_tutor: nullableOptional(zId), // FK/id
  id_sucursal: nullableOptional(zId), // FK/id
  id_edificio: nullableOptional(zId), // FK/id
  id_tienda: nullableOptional(zId), // FK/id
  id_bien: nullableOptional(zId), // FK/id
  id_deuda: nullableOptional(zId), // FK/id
  id_proveedor: nullableOptional(zId), // FK/id
  id_departamento: nullableOptional(zId), // FK/id
  id_cuenta: zId, // FK/id
  prioridad: zSmallInt.optional(),
  vigente_desde: zDateOnly.optional(),
  vigente_hasta: nullableOptional(zDateOnly),
};

const cuentaAsignacionUpdateShape = {
  entidad_tipo: zText.optional(),
  id_empleado: nullableOptional(zId), // FK/id
  id_persona_estudiante: nullableOptional(zId), // FK/id
  id_persona_tutor: nullableOptional(zId), // FK/id
  id_sucursal: nullableOptional(zId), // FK/id
  id_edificio: nullableOptional(zId), // FK/id
  id_tienda: nullableOptional(zId), // FK/id
  id_bien: nullableOptional(zId), // FK/id
  id_deuda: nullableOptional(zId), // FK/id
  id_proveedor: nullableOptional(zId), // FK/id
  id_departamento: nullableOptional(zId), // FK/id
  id_cuenta: zId.optional(), // FK/id
  prioridad: zSmallInt.optional(),
  vigente_desde: zDateOnly.optional(),
  vigente_hasta: nullableOptional(zDateOnly),
};

const cuentaAsignacionCreateSchema = z.object(cuentaAsignacionCreateShape).strict();
const cuentaAsignacionUpdateSchema = nonEmptyUpdate(z.object(cuentaAsignacionUpdateShape).strict().partial());

const cuentaAsignacionIdSchema = z.object({
  id_cuenta_asignacion: zId,
}).strict();

const cuentaAsignacionQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
  id_sucursal: zId.optional(),
}).strip();

module.exports = {
  cuentaAsignacionCreateSchema,
  cuentaAsignacionUpdateSchema,
  cuentaAsignacionIdSchema,
  cuentaAsignacionQuerySchema,
  createSchema: cuentaAsignacionCreateSchema,
  updateSchema: cuentaAsignacionUpdateSchema,
  idSchema: cuentaAsignacionIdSchema,
  querySchema: cuentaAsignacionQuerySchema,
};
