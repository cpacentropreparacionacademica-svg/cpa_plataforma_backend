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

// Schema: servicios_educativos.horarios
// Campos omitidos del body por recomendación: id_horario, fecha_registro, estado_registro, id_usuario_modificacion, version_registro.
const horariosCreateShape = {
  repeticion: nullableOptional(zText),
  hora_inicio_lunes: nullableOptional(zTime),
  hora_inicio_martes: nullableOptional(zTime),
  hora_inicio_miercoles: nullableOptional(zTime),
  hora_inicio_jueves: nullableOptional(zTime),
  hora_inicio_viernes: nullableOptional(zTime),
  hora_inicio_sabado: nullableOptional(zTime),
  hora_fin_lunes: nullableOptional(zTime),
  hora_fin_martes: nullableOptional(zTime),
  hora_fin_miercoles: nullableOptional(zTime),
  hora_fin_jueves: nullableOptional(zTime),
  hora_fin_viernes: nullableOptional(zTime),
  hora_fin_sabado: nullableOptional(zTime),
  id_usuario: nullableOptional(zId), // FK/id
};

const horariosUpdateShape = {
  repeticion: nullableOptional(zText),
  hora_inicio_lunes: nullableOptional(zTime),
  hora_inicio_martes: nullableOptional(zTime),
  hora_inicio_miercoles: nullableOptional(zTime),
  hora_inicio_jueves: nullableOptional(zTime),
  hora_inicio_viernes: nullableOptional(zTime),
  hora_inicio_sabado: nullableOptional(zTime),
  hora_fin_lunes: nullableOptional(zTime),
  hora_fin_martes: nullableOptional(zTime),
  hora_fin_miercoles: nullableOptional(zTime),
  hora_fin_jueves: nullableOptional(zTime),
  hora_fin_viernes: nullableOptional(zTime),
  hora_fin_sabado: nullableOptional(zTime),
  id_usuario: nullableOptional(zId), // FK/id
};

const horariosCreateSchema = z.object(horariosCreateShape).strict();
const horariosUpdateSchema = nonEmptyUpdate(z.object(horariosUpdateShape).strict().partial());

const horariosIdSchema = z.object({
  id_horario: zId,
}).strict();

const horariosQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  horariosCreateSchema,
  horariosUpdateSchema,
  horariosIdSchema,
  horariosQuerySchema,
  createSchema: horariosCreateSchema,
  updateSchema: horariosUpdateSchema,
  idSchema: horariosIdSchema,
  querySchema: horariosQuerySchema,
};
