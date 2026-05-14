const PersonaUsuarioRepository = require("../repository/persona_usuario.repository");
const PersonaService = require("./persona.service");
const AuthService = require("../../auth/service/auth.service");
const createCrudService = require("../../../shared/service/createCrudService");

const baseService = createCrudService({
  Repository: PersonaUsuarioRepository,
  entityName: "persona_usuario",
  serviceName: "PersonaUsuarioService",
});

function validationErrorResult(message, errors = null) {
  return { success: false, statusCode: 400, message, errors };
}

function childCreationErrorResult(personaResult, childResult) {
  return {
    success: false,
    statusCode: childResult.statusCode || 500,
    message: childResult.message || "La persona fue creada, pero no se pudo crear el usuario.",
    errors: {
      persona_creada: personaResult.data || null,
      usuario_error: childResult.errors || childResult.message || null,
    },
  };
}

async function create(payload, authUserId) {
  if (!payload?.persona || !payload?.usuario) {
    return validationErrorResult("Debe enviar los objetos 'persona' y 'usuario'.");
  }

  const personaResult = await PersonaService.create(payload.persona, authUserId);

  if (!personaResult.success) {
    return personaResult;
  }

  const persona = personaResult.data || {};
  const idPersona = persona.id_persona;

  if (!idPersona) {
    return validationErrorResult("No se pudo obtener el id_persona creado.");
  }

  const usuarioPayload = {
    ...payload.usuario,
    id_persona: idPersona,
    email: persona.email,
  };

  const usuarioResult = await AuthService.signup(usuarioPayload);

  if (!usuarioResult.success) {
    return childCreationErrorResult(personaResult, usuarioResult);
  }

  return {
    success: true,
    message: "Usuario registrado correctamente.",
    data: {
      persona: personaResult.data,
      usuario: usuarioResult.data,
    },
  };
}

async function update(idOrParams, payload, authUserId) {
  const personaPayload = payload?.persona;
  const usuarioPayload = payload?.usuario;

  if (!personaPayload && !usuarioPayload) {
    return validationErrorResult("Debe enviar al menos 'persona' o 'usuario' para actualizar.");
  }

  const result = {};

  if (personaPayload) {
    const personaResult = await PersonaService.update(idOrParams, personaPayload, authUserId);

    if (!personaResult.success) {
      return personaResult;
    }

    result.persona = personaResult.data;
  }

  if (usuarioPayload) {
    const usuarioResult = await baseService.update(idOrParams, usuarioPayload, authUserId);

    if (!usuarioResult.success) {
      return usuarioResult;
    }

    result.usuario = usuarioResult.data;
  }

  return {
    success: true,
    message: "Usuario actualizado correctamente.",
    data: result,
  };
}

module.exports = {
  ...baseService,
  create,
  update,
};
