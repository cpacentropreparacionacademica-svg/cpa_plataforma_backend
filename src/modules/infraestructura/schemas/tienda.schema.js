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

// Schema: infraestructura.tienda
// Campos omitidos del body por recomendación: id_tienda, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const tiendaCreateShape = {
  id_espacio: nullableOptional(zId), // FK/id
  codigo: zCode(40),
  nombre: zString(150),
  horario_texto: nullableOptional(zString(240)),
  id_responsable: nullableOptional(zId), // FK/id
};

const tiendaUpdateShape = {
  id_espacio: nullableOptional(zId), // FK/id
  codigo: zCode(40).optional(),
  nombre: zString(150).optional(),
  horario_texto: nullableOptional(zString(240)),
  id_responsable: nullableOptional(zId), // FK/id
};

const tiendaCreateSchema = z.object(tiendaCreateShape).strict();
const tiendaUpdateSchema = nonEmptyUpdate(z.object(tiendaUpdateShape).strict().partial());

const tiendaIdSchema = z.object({
  id_tienda: zId,
}).strict();

const tiendaQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  tiendaCreateSchema,
  tiendaUpdateSchema,
  tiendaIdSchema,
  tiendaQuerySchema,
  createSchema: tiendaCreateSchema,
  updateSchema: tiendaUpdateSchema,
  idSchema: tiendaIdSchema,
  querySchema: tiendaQuerySchema,
};
