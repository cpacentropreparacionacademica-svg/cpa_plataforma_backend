const TitularRepository = require("../repository/titular.repository");
const PersonaService = require("../../persona/service/persona.service");
const createCrudService = require("../../../shared/service/createCrudService");

const baseService = createCrudService({
  Repository: TitularRepository,
  entityName: "titular",
  serviceName: "TitularService",
});

function validationErrorResult(message, errors = null) {
  return { success: false, statusCode: 400, message, errors };
}

function childCreationErrorResult(personaResult, childResult) {
  return {
    success: false,
    statusCode: childResult.statusCode || 500,
    message: childResult.message || "La persona fue creada, pero no se pudo crear el titular.",
    errors: {
      persona_creada: personaResult.data || null,
      titular_error: childResult.errors || childResult.message || null,
    },
  };
}

async function create(payload, authUserId) {
  if (!payload?.persona || !payload?.titular) {
    return validationErrorResult("Debe enviar los objetos 'persona' y 'titular'.");
  }

  const personaResult = await PersonaService.create(payload.persona, authUserId);

  if (!personaResult.success) {
    return personaResult;
  }

  const idPersona = personaResult.data?.id_persona;

  if (!idPersona) {
    return validationErrorResult("No se pudo obtener el id_persona creado.");
  }

  const titularPayload = {
    ...payload.titular,
    id_persona: idPersona,
  };

  const titularResult = await baseService.create(titularPayload, authUserId);

  if (!titularResult.success) {
    return childCreationErrorResult(personaResult, titularResult);
  }

  return {
    success: true,
    message: "Titular registrado correctamente.",
    data: {
      persona: personaResult.data,
      titular: titularResult.data,
    },
  };
}

async function update(idOrParams, payload, authUserId) {
  const personaPayload = payload?.persona;
  const titularPayload = payload?.titular;

  if (!personaPayload && !titularPayload) {
    return validationErrorResult("Debe enviar al menos 'persona' o 'titular' para actualizar.");
  }

  const result = {};
  let currentTitular = null;

  if (personaPayload) {
    const currentTitularResult = await baseService.get(idOrParams);

    if (!currentTitularResult.success) {
      return currentTitularResult;
    }

    currentTitular = currentTitularResult.data;
    const idPersona = currentTitular?.id_persona;

    if (!idPersona) {
      return validationErrorResult("No se pudo resolver el id_persona del titular.");
    }

    const personaResult = await PersonaService.update(idPersona, personaPayload, authUserId);

    if (!personaResult.success) {
      return personaResult;
    }

    result.persona = personaResult.data;
  }

  if (titularPayload) {
    const titularResult = await baseService.update(idOrParams, titularPayload, authUserId);

    if (!titularResult.success) {
      return titularResult;
    }

    result.titular = titularResult.data;
  } else if (currentTitular) {
    result.titular = currentTitular;
  }

  return {
    success: true,
    message: "Titular actualizado correctamente.",
    data: result,
  };
}

module.exports = {
  ...baseService,
  create,
  update,
};
