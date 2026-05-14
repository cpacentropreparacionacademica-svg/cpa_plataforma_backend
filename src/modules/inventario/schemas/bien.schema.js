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

// Schema: inventario.bien
// Campos omitidos del body por recomendación: id_bien, estado_registro, fecha_registro, fecha_modificacion, version_registro, id_usuario_creador, id_usuario_modificacion.
const bienCreateShape = {
  sku: zString(60),
  nombre: zString(180),
  descripcion: nullableOptional(zText),
  tipo: z.enum(["MERCADERIA", "MATERIA_PRIMA", "SUMINISTRO", "SERVICIO", "ACTIVO_FIJO"]), // enum
  categoria: nullableOptional(zString(100)),
  subcategoria: nullableOptional(zString(100)),
  unidad_compra: nullableOptional(zString(20)),
  unidad_venta: nullableOptional(zString(20)),
  factor_conversion: nullableOptional(zDecimal(18, 6)),
  controla_inventario_loteable: zBoolean.optional(),
  controla_inventario_no_loteable: zBoolean.optional(),
  metodo_valuacion: nullableOptional(z.enum(["PEPS", "UEPS", "PROM"])), // enum
  costo_referencia: nullableOptional(zDecimal(18, 4)),
  precio_referencia: nullableOptional(zDecimal(18, 2)),
  moneda_referencia: nullableOptional(zString(3)),
  marca: nullableOptional(zString(80)),
  modelo: nullableOptional(zString(80)),
  codigo_barras: nullableOptional(zCode(80)),
  peso_kg: nullableOptional(zDecimal(18, 3)),
  largo_m: nullableOptional(zDecimal(18, 4)),
  ancho_m: nullableOptional(zDecimal(18, 4)),
  profundidad_m: nullableOptional(zDecimal(18, 4)),
  volumen_m3: nullableOptional(zDecimal(18, 4)),
  id_cuenta_existencias: nullableOptional(zId), // FK/id
  id_cuenta_costo_venta: nullableOptional(zId), // FK/id
  id_cuenta_ingreso: nullableOptional(zId), // FK/id
  id_cuenta_depreciacion: nullableOptional(zId), // FK/id
  id_cuenta_depreciacion_acumulada: nullableOptional(zId), // FK/id
  valor_origen: nullableOptional(zDecimal(18, 2)),
  vida_util_meses: nullableOptional(zInt),
  valor_residual: nullableOptional(zDecimal(18, 2)),
  metodo_depreciacion: nullableOptional(z.enum(["LINEA_RECTA", "SDD", "UNIDADES"])), // enum
  es_producto_tienda: zBoolean.optional(),
};

const bienUpdateShape = {
  sku: zString(60).optional(),
  nombre: zString(180).optional(),
  descripcion: nullableOptional(zText),
  tipo: z.enum(["MERCADERIA", "MATERIA_PRIMA", "SUMINISTRO", "SERVICIO", "ACTIVO_FIJO"]).optional(), // enum
  categoria: nullableOptional(zString(100)),
  subcategoria: nullableOptional(zString(100)),
  unidad_compra: nullableOptional(zString(20)),
  unidad_venta: nullableOptional(zString(20)),
  factor_conversion: nullableOptional(zDecimal(18, 6)),
  controla_inventario_loteable: zBoolean.optional(),
  controla_inventario_no_loteable: zBoolean.optional(),
  metodo_valuacion: nullableOptional(z.enum(["PEPS", "UEPS", "PROM"])), // enum
  costo_referencia: nullableOptional(zDecimal(18, 4)),
  precio_referencia: nullableOptional(zDecimal(18, 2)),
  moneda_referencia: nullableOptional(zString(3)),
  marca: nullableOptional(zString(80)),
  modelo: nullableOptional(zString(80)),
  codigo_barras: nullableOptional(zCode(80)),
  peso_kg: nullableOptional(zDecimal(18, 3)),
  largo_m: nullableOptional(zDecimal(18, 4)),
  ancho_m: nullableOptional(zDecimal(18, 4)),
  profundidad_m: nullableOptional(zDecimal(18, 4)),
  volumen_m3: nullableOptional(zDecimal(18, 4)),
  id_cuenta_existencias: nullableOptional(zId), // FK/id
  id_cuenta_costo_venta: nullableOptional(zId), // FK/id
  id_cuenta_ingreso: nullableOptional(zId), // FK/id
  id_cuenta_depreciacion: nullableOptional(zId), // FK/id
  id_cuenta_depreciacion_acumulada: nullableOptional(zId), // FK/id
  valor_origen: nullableOptional(zDecimal(18, 2)),
  vida_util_meses: nullableOptional(zInt),
  valor_residual: nullableOptional(zDecimal(18, 2)),
  metodo_depreciacion: nullableOptional(z.enum(["LINEA_RECTA", "SDD", "UNIDADES"])), // enum
  es_producto_tienda: zBoolean.optional(),
};

const bienCreateSchema = z.object(bienCreateShape).strict();
const bienUpdateSchema = nonEmptyUpdate(z.object(bienUpdateShape).strict().partial());

const bienIdSchema = z.object({
  id_bien: zId,
}).strict();

const bienQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  bienCreateSchema,
  bienUpdateSchema,
  bienIdSchema,
  bienQuerySchema,
  createSchema: bienCreateSchema,
  updateSchema: bienUpdateSchema,
  idSchema: bienIdSchema,
  querySchema: bienQuerySchema,
};
