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

// Schema: contabilidad.transaccion
// Campos omitidos del body por recomendación: id_transaccion, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const transaccionCreateShape = {
  fecha_transaccion: zDateOnly.optional(),
  tipo_transaccion: z.enum(["GENERAL", "COSTO", "VENTA", "BIEN", "DEUDA"]), // enum
  sub_tipo_transaccion: nullableOptional(zText),
  glosa: nullableOptional(zString(300)),
  id_centro_costo_mapa: nullableOptional(zId), // FK/id
  id_bien: nullableOptional(zId), // FK/id
  id_movimiento_detalle: nullableOptional(zId), // FK/id
  id_deuda: nullableOptional(zId), // FK/id
  id_pago_deuda: nullableOptional(zId), // FK/id
  id_empleado: nullableOptional(zId), // FK/id
  id_empleado_pago: nullableOptional(zId), // FK/id
  id_departamento: nullableOptional(zId), // FK/id
  id_clase_por_hora: nullableOptional(zId), // FK/id
  id_producto_educativo: nullableOptional(zId), // FK/id
  id_curso_version: nullableOptional(zId), // FK/id
  id_sucursal: nullableOptional(zId), // FK/id
  id_tienda: nullableOptional(zId), // FK/id
  id_proveedor: nullableOptional(zId), // FK/id
  id_dividendo_pago: nullableOptional(zId), // FK/id
  id_emision_titulo: nullableOptional(zId), // FK/id
  id_cliente: nullableOptional(zInt), // FK/id
  id_pago_tutor: nullableOptional(zId), // FK/id
};

const transaccionUpdateShape = {
  fecha_transaccion: zDateOnly.optional(),
  tipo_transaccion: z.enum(["GENERAL", "COSTO", "VENTA", "BIEN", "DEUDA"]).optional(), // enum
  sub_tipo_transaccion: nullableOptional(zText),
  glosa: nullableOptional(zString(300)),
  id_centro_costo_mapa: nullableOptional(zId), // FK/id
  id_bien: nullableOptional(zId), // FK/id
  id_movimiento_detalle: nullableOptional(zId), // FK/id
  id_deuda: nullableOptional(zId), // FK/id
  id_pago_deuda: nullableOptional(zId), // FK/id
  id_empleado: nullableOptional(zId), // FK/id
  id_empleado_pago: nullableOptional(zId), // FK/id
  id_departamento: nullableOptional(zId), // FK/id
  id_clase_por_hora: nullableOptional(zId), // FK/id
  id_producto_educativo: nullableOptional(zId), // FK/id
  id_curso_version: nullableOptional(zId), // FK/id
  id_sucursal: nullableOptional(zId), // FK/id
  id_tienda: nullableOptional(zId), // FK/id
  id_proveedor: nullableOptional(zId), // FK/id
  id_dividendo_pago: nullableOptional(zId), // FK/id
  id_emision_titulo: nullableOptional(zId), // FK/id
  id_cliente: nullableOptional(zInt), // FK/id
  id_pago_tutor: nullableOptional(zId), // FK/id
};

const transaccionCreateSchema = z.object(transaccionCreateShape).strict();
const transaccionUpdateSchema = nonEmptyUpdate(z.object(transaccionUpdateShape).strict().partial());

const transaccionIdSchema = z.object({
  id_transaccion: zId,
}).strict();

const transaccionQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
  id_sucursal: zId.optional(),
}).strip();

module.exports = {
  transaccionCreateSchema,
  transaccionUpdateSchema,
  transaccionIdSchema,
  transaccionQuerySchema,
  createSchema: transaccionCreateSchema,
  updateSchema: transaccionUpdateSchema,
  idSchema: transaccionIdSchema,
  querySchema: transaccionQuerySchema,
};
