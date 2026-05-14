const { z } = require("zod");
const {
  zId,
  zBoolean,
  zString,
  nullableOptional,
  nonEmptyUpdate,
  listQuerySchema,
} = require("../../../shared/validation/zod.helpers");

const {
  personaCreateSchema,
  personaUpdateSchema,
} = require("./persona.schema");

const passwordSchema = z
  .string({
    required_error: "La contraseña es obligatoria.",
    invalid_type_error: "La contraseña debe ser texto.",
  })
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(100, "La contraseña no puede superar los 100 caracteres.");

// Schema compuesto: persona.persona + persona.persona_usuario.
// El password entra en claro y el service delega en AuthService.signup para hashearlo.
const usuarioCreateShape = {
  nombre_usuario: zString(80),
  password: passwordSchema,
  tipo_usuario: nullableOptional(zString(200)),
  es_super_usuario: zBoolean.optional(),
};

const usuarioUpdateShape = {
  nombre_usuario: zString(80).optional(),
  tipo_usuario: nullableOptional(zString(200)),
  es_super_usuario: zBoolean.optional(),
};

const usuarioCreateSchema = z.object(usuarioCreateShape).strict();
const usuarioUpdateSchema = nonEmptyUpdate(z.object(usuarioUpdateShape).strict().partial());

const personaUsuarioCreateSchema = z.object({
  persona: personaCreateSchema,
  usuario: usuarioCreateSchema,
}).strict();

const personaUsuarioUpdateSchema = nonEmptyUpdate(z.object({
  persona: personaUpdateSchema.optional(),
  usuario: usuarioUpdateSchema.optional(),
}).strict());

const personaUsuarioIdSchema = z.object({
  id_persona: zId,
}).strict();

const personaUsuarioQuerySchema = listQuerySchema.extend({
  estado_registro: zString(20).optional(),
}).strip();

module.exports = {
  usuarioCreateSchema,
  usuarioUpdateSchema,
  personaUsuarioCreateSchema,
  personaUsuarioUpdateSchema,
  personaUsuarioIdSchema,
  personaUsuarioQuerySchema,
  createSchema: personaUsuarioCreateSchema,
  updateSchema: personaUsuarioUpdateSchema,
  idSchema: personaUsuarioIdSchema,
  querySchema: personaUsuarioQuerySchema,
};
