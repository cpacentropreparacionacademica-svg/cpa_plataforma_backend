const PersonaTutorRepository = require("../repository/persona_tutor.repository");
const PersonaService = require("./persona.service");
const createCrudService = require("../../../shared/service/createCrudService");

const baseService = createCrudService({
  Repository: PersonaTutorRepository,
  entityName: "persona_tutor",
  serviceName: "PersonaTutorService",
});

function validationErrorResult(message, errors = null) {
  return { success: false, statusCode: 400, message, errors };
}

function childCreationErrorResult(personaResult, childResult) {
  return {
    success: false,
    statusCode: childResult.statusCode || 500,
    message: childResult.message || "La persona fue creada, pero no se pudo crear el tutor.",
    errors: {
      persona_creada: personaResult.data || null,
      tutor_error: childResult.errors || childResult.message || null,
    },
  };
}

async function create(payload, authUserId) {
  if (!payload?.persona || !payload?.tutor) {
    return validationErrorResult("Debe enviar los objetos 'persona' y 'tutor'.");
  }

  const personaResult = await PersonaService.create(payload.persona, authUserId);

  if (!personaResult.success) {
    return personaResult;
  }

  const idPersona = personaResult.data?.id_persona;

  if (!idPersona) {
    return validationErrorResult("No se pudo obtener el id_persona creado.");
  }

  const tutorPayload = {
    ...payload.tutor,
    id_persona: idPersona,
  };

  const tutorResult = await baseService.create(tutorPayload, authUserId);

  if (!tutorResult.success) {
    return childCreationErrorResult(personaResult, tutorResult);
  }

  return {
    success: true,
    message: "Tutor registrado correctamente.",
    data: {
      persona: personaResult.data,
      tutor: tutorResult.data,
    },
  };
}

async function update(idOrParams, payload, authUserId) {
  const personaPayload = payload?.persona;
  const tutorPayload = payload?.tutor;

  if (!personaPayload && !tutorPayload) {
    return validationErrorResult("Debe enviar al menos 'persona' o 'tutor' para actualizar.");
  }

  const result = {};
  let currentTutor = null;

  if (personaPayload) {
    const currentTutorResult = await baseService.get(idOrParams);

    if (!currentTutorResult.success) {
      return currentTutorResult;
    }

    currentTutor = currentTutorResult.data;
    const idPersona = currentTutor?.id_persona;

    if (!idPersona) {
      return validationErrorResult("No se pudo resolver el id_persona del tutor.");
    }

    const personaResult = await PersonaService.update(idPersona, personaPayload, authUserId);

    if (!personaResult.success) {
      return personaResult;
    }

    result.persona = personaResult.data;
  }

  if (tutorPayload) {
    const tutorResult = await baseService.update(idOrParams, tutorPayload, authUserId);

    if (!tutorResult.success) {
      return tutorResult;
    }

    result.tutor = tutorResult.data;
  } else if (currentTutor) {
    result.tutor = currentTutor;
  }

  return {
    success: true,
    message: "Tutor actualizado correctamente.",
    data: result,
  };
}

module.exports = {
  ...baseService,
  create,
  update,
};
