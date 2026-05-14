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

// Schema: infraestructura.edificio
// Campos omitidos del body por recomendación: id_edificio, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const edificioCreateShape = {
  id_sucursal: zId, // FK/id
  codigo: zCode(40),
  nombre: zString(150),
  direccion_linea1: nullableOptional(zString(180)),
  ciudad: nullableOptional(zString(80)),
  departamento: nullableOptional(zString(80)),
  pais: nullableOptional(zString(80)),
  latitud: nullableOptional(zDecimal(9, 6)),
  longitud: nullableOptional(zDecimal(9, 6)),
  pisos: nullableOptional(zSmallInt),
  largo_m: nullableOptional(zNumeric),
  ancho_m: nullableOptional(zNumeric),
  id_administrador: nullableOptional(zId), // FK/id
};

const edificioUpdateShape = {
  id_sucursal: zId.optional(), // FK/id
  codigo: zCode(40).optional(),
  nombre: zString(150).optional(),
  direccion_linea1: nullableOptional(zString(180)),
  ciudad: nullableOptional(zString(80)),
  departamento: nullableOptional(zString(80)),
  pais: nullableOptional(zString(80)),
  latitud: nullableOptional(zDecimal(9, 6)),
  longitud: nullableOptional(zDecimal(9, 6)),
  pisos: nullableOptional(zSmallInt),
  largo_m: nullableOptional(zNumeric),
  ancho_m: nullableOptional(zNumeric),
  id_administrador: nullableOptional(zId), // FK/id
};

const edificioCreateSchema = z.object(edificioCreateShape).strict();
const edificioUpdateSchema = nonEmptyUpdate(z.object(edificioUpdateShape).strict().partial());

const edificioIdSchema = z.object({
  id_edificio: zId,
}).strict();

const edificioQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
  id_sucursal: zId.optional(),
}).strip();

module.exports = {
  edificioCreateSchema,
  edificioUpdateSchema,
  edificioIdSchema,
  edificioQuerySchema,
  createSchema: edificioCreateSchema,
  updateSchema: edificioUpdateSchema,
  idSchema: edificioIdSchema,
  querySchema: edificioQuerySchema,
};
