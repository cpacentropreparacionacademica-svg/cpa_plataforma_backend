const PersonaEstudianteRepository = require("../repository/persona_estudiante.repository");
const PersonaService = require("./persona.service");
const createCrudService = require("../../../shared/service/createCrudService");

const baseService = createCrudService({
  Repository: PersonaEstudianteRepository,
  entityName: "persona_estudiante",
  serviceName: "PersonaEstudianteService",
});

function validationErrorResult(message, errors = null) {
  return { success: false, statusCode: 400, message, errors };
}

function childCreationErrorResult(personaResult, childResult) {
  return {
    success: false,
    statusCode: childResult.statusCode || 500,
    message: childResult.message || "La persona fue creada, pero no se pudo crear el estudiante.",
    errors: {
      persona_creada: personaResult.data || null,
      estudiante_error: childResult.errors || childResult.message || null,
    },
  };
}

async function create(payload, authUserId) {
  if (!payload?.persona || !payload?.estudiante) {
    return validationErrorResult("Debe enviar los objetos 'persona' y 'estudiante'.");
  }

  const personaResult = await PersonaService.create(payload.persona, authUserId);

  if (!personaResult.success) {
    return personaResult;
  }

  const idPersona = personaResult.data?.id_persona;

  if (!idPersona) {
    return validationErrorResult("No se pudo obtener el id_persona creado.");
  }

  const estudiantePayload = {
    ...payload.estudiante,
    id_persona: idPersona,
  };

  const estudianteResult = await baseService.create(estudiantePayload, authUserId);

  if (!estudianteResult.success) {
    return childCreationErrorResult(personaResult, estudianteResult);
  }

  return {
    success: true,
    message: "Estudiante registrado correctamente.",
    data: {
      persona: personaResult.data,
      estudiante: estudianteResult.data,
    },
  };
}

async function update(idOrParams, payload, authUserId) {
  const personaPayload = payload?.persona;
  const estudiantePayload = payload?.estudiante;

  if (!personaPayload && !estudiantePayload) {
    return validationErrorResult("Debe enviar al menos 'persona' o 'estudiante' para actualizar.");
  }

  const result = {};

  if (personaPayload) {
    const personaResult = await PersonaService.update(idOrParams, personaPayload, authUserId);

    if (!personaResult.success) {
      return personaResult;
    }

    result.persona = personaResult.data;
  }

  if (estudiantePayload) {
    const estudianteResult = await baseService.update(idOrParams, estudiantePayload, authUserId);

    if (!estudianteResult.success) {
      return estudianteResult;
    }

    result.estudiante = estudianteResult.data;
  }

  return {
    success: true,
    message: "Estudiante actualizado correctamente.",
    data: result,
  };
}

module.exports = {
  ...baseService,
  create,
  update,
};
