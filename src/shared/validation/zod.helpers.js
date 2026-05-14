const { z } = require("zod");

const emptyToUndefined = (value) => value === "" ? undefined : value;
const emptyToNull = (value) => value === "" ? null : value;

const zId = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int("Debe ser un entero.").positive("Debe ser mayor a 0.").safe("Número fuera de rango seguro.")
);

const zInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int("Debe ser un entero.").safe("Número fuera de rango seguro.")
);

const zSmallInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int("Debe ser un entero.").min(-32768).max(32767)
);

const zNumeric = z.preprocess(
  emptyToUndefined,
  z.coerce.number().finite("Debe ser un número válido.")
);

const zDecimal = (precision = 18, scale = 2) => zNumeric.refine((value) => {
  const [integerPart = "", decimalPart = ""] = String(Math.abs(value)).split(".");
  return integerPart.replace(/^0+/, "").length <= precision - scale && decimalPart.length <= scale;
}, `Debe respetar la precisión decimal (${precision}, ${scale}).`);

const zBoolean = z.preprocess((value) => {
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  if (value === "") return undefined;
  return value;
}, z.boolean());

const zString = (max = 255) => z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, "No puede estar vacío.").max(max, `Máximo ${max} caracteres.`)
);

const zText = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, "No puede estar vacío.")
);

const zEmail = (max = 255) => z.preprocess(
  emptyToUndefined,
  z.string().trim().email("Email inválido.").max(max, `Máximo ${max} caracteres.`)
);

const zPhone = (max = 30) => z.preprocess(
  emptyToUndefined,
  z.string().trim().min(6, "Teléfono demasiado corto.").max(max, `Máximo ${max} caracteres.`)
);

const zCode = (max = 50) => z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, "Código requerido.").max(max, `Máximo ${max} caracteres.`)
);

const zDateOnly = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Debe tener formato YYYY-MM-DD.")
);

const zDateTime = z.preprocess(
  emptyToUndefined,
  z.coerce.date()
);

const zTime = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Debe tener formato HH:mm o HH:mm:ss.")
);

const zJson = z.union([
  z.record(z.any()),
  z.array(z.any()),
  z.string().transform((value, ctx) => {
    try {
      return JSON.parse(value);
    } catch (_error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "JSON inválido." });
      return z.NEVER;
    }
  }),
]);

const nullableOptional = (schema) => z.preprocess(
  emptyToNull,
  schema.nullable().optional()
);

const nonEmptyUpdate = (schema) => schema.refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debe enviar al menos un campo para actualizar." }
);

const listQuerySchema = z.object({
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).default(20)),
  offset: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).default(0)),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  orderBy: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  orderDir: z.enum(["ASC", "DESC", "asc", "desc"]).optional().transform((value) => value ? value.toUpperCase() : value),
});

module.exports = {
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
};
