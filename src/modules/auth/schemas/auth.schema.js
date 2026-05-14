const { z } = require("zod");

const {
  zId,
  zString,
  zBoolean,
  nullableOptional,
} = require("../../../shared/validation/zod.helpers");

const emailSchema = z
  .string({
    required_error: "El email es obligatorio.",
    invalid_type_error: "El email debe ser texto.",
  })
  .trim()
  .toLowerCase()
  .email("El email no tiene un formato válido.")
  .max(150, "El email no puede superar los 150 caracteres.");

const passwordSchema = z
  .string({
    required_error: "La contraseña es obligatoria.",
    invalid_type_error: "La contraseña debe ser texto.",
  })
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(100, "La contraseña no puede superar los 100 caracteres.");

const tokenSchema = z
  .string({
    required_error: "El token es obligatorio.",
    invalid_type_error: "El token debe ser texto.",
  })
  .trim()
  .length(5, "El token debe tener exactamente 5 caracteres.");

const loginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

const signupSchema = z
  .object({
    id_persona: zId,
    email: emailSchema,
    nombre_usuario: zString(80),
    password: passwordSchema,
    tipo_usuario: nullableOptional(zString(200)),
    es_super_usuario: zBoolean.optional(),
  })
  .strict();

const changePasswordSchema = z
  .object({
    email: emailSchema,
    new_password: passwordSchema,
    token_confirm: tokenSchema,
  })
  .strict();

const activateUserSchema = z
  .object({
    email: emailSchema,
    token_confirm: tokenSchema,
  })
  .strict();

const requestNewPasswordTokenSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

module.exports = {
  loginSchema,
  signupSchema,
  changePasswordSchema,
  activateUserSchema,
  requestNewPasswordTokenSchema,
  emailSchema,
  passwordSchema,
  tokenSchema,
};