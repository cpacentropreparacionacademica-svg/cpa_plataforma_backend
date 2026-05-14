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

// Schema: infraestructura.sucursal
// Campos omitidos del body por recomendación: id_sucursal, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const sucursalCreateShape = {
  codigo: zCode(40),
  nombre: zString(150),
  telefono: nullableOptional(zPhone(100)),
  email: nullableOptional(zEmail(200)),
  direccion_linea1: nullableOptional(zString(180)),
  ciudad: nullableOptional(zString(80)),
  departamento: nullableOptional(zString(80)),
  pais: nullableOptional(zString(80)),
  horario_texto: nullableOptional(zString(240)),
  largo_m: nullableOptional(zNumeric),
  ancho_m: nullableOptional(zNumeric),
};

const sucursalUpdateShape = {
  codigo: zCode(40).optional(),
  nombre: zString(150).optional(),
  telefono: nullableOptional(zPhone(100)),
  email: nullableOptional(zEmail(200)),
  direccion_linea1: nullableOptional(zString(180)),
  ciudad: nullableOptional(zString(80)),
  departamento: nullableOptional(zString(80)),
  pais: nullableOptional(zString(80)),
  horario_texto: nullableOptional(zString(240)),
  largo_m: nullableOptional(zNumeric),
  ancho_m: nullableOptional(zNumeric),
};

const sucursalCreateSchema = z.object(sucursalCreateShape).strict();
const sucursalUpdateSchema = nonEmptyUpdate(z.object(sucursalUpdateShape).strict().partial());

const sucursalIdSchema = z.object({
  id_sucursal: zId,
}).strict();

const sucursalQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
  id_sucursal: zId.optional(),
}).strip();

module.exports = {
  sucursalCreateSchema,
  sucursalUpdateSchema,
  sucursalIdSchema,
  sucursalQuerySchema,
  createSchema: sucursalCreateSchema,
  updateSchema: sucursalUpdateSchema,
  idSchema: sucursalIdSchema,
  querySchema: sucursalQuerySchema,
};
