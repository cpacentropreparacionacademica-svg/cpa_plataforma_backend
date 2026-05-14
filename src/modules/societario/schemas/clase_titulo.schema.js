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

// Schema: societario.clase_titulo
// Campos omitidos del body por recomendación: id_clase_titulo, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const claseTituloCreateShape = {
  tipo: z.enum(["ACCION", "CUOTA", "PARTICIPACION", "BONO_CONVERTIBLE", "SAFE", "WARRANT", "OPCION"]).optional(), // enum
  sub_tipo: zString(60),
  descripcion: nullableOptional(zText),
  valor_nominal: nullableOptional(zDecimal(18, 6)),
  derechos_voto_por_titulo: nullableOptional(zDecimal(18, 6)),
  prioridad_dividendo_bp: nullableOptional(zInt),
  pref_liquidacion_x: nullableOptional(zDecimal(18, 6)),
  es_convertible: nullableOptional(zBoolean),
  es_participante: nullableOptional(zBoolean),
};

const claseTituloUpdateShape = {
  tipo: z.enum(["ACCION", "CUOTA", "PARTICIPACION", "BONO_CONVERTIBLE", "SAFE", "WARRANT", "OPCION"]).optional(), // enum
  sub_tipo: zString(60).optional(),
  descripcion: nullableOptional(zText),
  valor_nominal: nullableOptional(zDecimal(18, 6)),
  derechos_voto_por_titulo: nullableOptional(zDecimal(18, 6)),
  prioridad_dividendo_bp: nullableOptional(zInt),
  pref_liquidacion_x: nullableOptional(zDecimal(18, 6)),
  es_convertible: nullableOptional(zBoolean),
  es_participante: nullableOptional(zBoolean),
};

const claseTituloCreateSchema = z.object(claseTituloCreateShape).strict();
const claseTituloUpdateSchema = nonEmptyUpdate(z.object(claseTituloUpdateShape).strict().partial());

const claseTituloIdSchema = z.object({
  id_clase_titulo: zId,
}).strict();

const claseTituloQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  claseTituloCreateSchema,
  claseTituloUpdateSchema,
  claseTituloIdSchema,
  claseTituloQuerySchema,
  createSchema: claseTituloCreateSchema,
  updateSchema: claseTituloUpdateSchema,
  idSchema: claseTituloIdSchema,
  querySchema: claseTituloQuerySchema,
};
