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

// Schema: infraestructura.espacio
// Campos omitidos del body por recomendación: id_espacio, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const espacioCreateShape = {
  id_edificio: zId, // FK/id
  tipo: z.enum(["AULA", "SALA"]), // enum
  categoria_sala: nullableOptional(z.enum(["OFICINA", "CONFERENCIA", "REUNION", "ESPERA", "TIENDA", "OTRA"])), // enum
  tipo_aula: nullableOptional(z.enum(["TEORIA", "LABORATORIO", "COMPUTACION", "MULTIUSO"])), // enum
  es_privada: nullableOptional(zBoolean),
  nombre: nullableOptional(zString(150)),
  piso: nullableOptional(zSmallInt),
  capacidad: nullableOptional(zSmallInt),
  largo_m: nullableOptional(zNumeric),
  ancho_m: nullableOptional(zNumeric),
  observaciones: nullableOptional(zString(240)),
};

const espacioUpdateShape = {
  id_edificio: zId.optional(), // FK/id
  tipo: z.enum(["AULA", "SALA"]).optional(), // enum
  categoria_sala: nullableOptional(z.enum(["OFICINA", "CONFERENCIA", "REUNION", "ESPERA", "TIENDA", "OTRA"])), // enum
  tipo_aula: nullableOptional(z.enum(["TEORIA", "LABORATORIO", "COMPUTACION", "MULTIUSO"])), // enum
  es_privada: nullableOptional(zBoolean),
  nombre: nullableOptional(zString(150)),
  piso: nullableOptional(zSmallInt),
  capacidad: nullableOptional(zSmallInt),
  largo_m: nullableOptional(zNumeric),
  ancho_m: nullableOptional(zNumeric),
  observaciones: nullableOptional(zString(240)),
};

const espacioCreateSchema = z.object(espacioCreateShape).strict();
const espacioUpdateSchema = nonEmptyUpdate(z.object(espacioUpdateShape).strict().partial());

const espacioIdSchema = z.object({
  id_espacio: zId,
}).strict();

const espacioQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  espacioCreateSchema,
  espacioUpdateSchema,
  espacioIdSchema,
  espacioQuerySchema,
  createSchema: espacioCreateSchema,
  updateSchema: espacioUpdateSchema,
  idSchema: espacioIdSchema,
  querySchema: espacioQuerySchema,
};
