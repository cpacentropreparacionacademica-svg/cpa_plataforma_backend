const EmpleadoRepository = require("../repository/empleado.repository");
const PersonaService = require("../../persona/service/persona.service");
const createCrudService = require("../../../shared/service/createCrudService");

const baseService = createCrudService({
  Repository: EmpleadoRepository,
  entityName: "empleado",
  serviceName: "EmpleadoService",
});

function validationErrorResult(message, errors = null) {
  return { success: false, statusCode: 400, message, errors };
}

function childCreationErrorResult(personaResult, childResult) {
  return {
    success: false,
    statusCode: childResult.statusCode || 500,
    message: childResult.message || "La persona fue creada, pero no se pudo crear el empleado.",
    errors: {
      persona_creada: personaResult.data || null,
      empleado_error: childResult.errors || childResult.message || null,
    },
  };
}

async function create(payload, authUserId) {
  if (!payload?.persona || !payload?.empleado) {
    return validationErrorResult("Debe enviar los objetos 'persona' y 'empleado'.");
  }

  const personaResult = await PersonaService.create(payload.persona, authUserId);

  if (!personaResult.success) {
    return personaResult;
  }

  const idPersona = personaResult.data?.id_persona;

  if (!idPersona) {
    return validationErrorResult("No se pudo obtener el id_persona creado.");
  }

  const empleadoPayload = {
    ...payload.empleado,
    id_persona: idPersona,
  };

  const empleadoResult = await baseService.create(empleadoPayload, authUserId);

  if (!empleadoResult.success) {
    return childCreationErrorResult(personaResult, empleadoResult);
  }

  return {
    success: true,
    message: "Empleado registrado correctamente.",
    data: {
      persona: personaResult.data,
      empleado: empleadoResult.data,
    },
  };
}

async function update(idOrParams, payload, authUserId) {
  const personaPayload = payload?.persona;
  const empleadoPayload = payload?.empleado;

  if (!personaPayload && !empleadoPayload) {
    return validationErrorResult("Debe enviar al menos 'persona' o 'empleado' para actualizar.");
  }

  const result = {};
  let currentEmpleado = null;

  if (personaPayload) {
    const currentEmpleadoResult = await baseService.get(idOrParams);

    if (!currentEmpleadoResult.success) {
      return currentEmpleadoResult;
    }

    currentEmpleado = currentEmpleadoResult.data;
    const idPersona = currentEmpleado?.id_persona;

    if (!idPersona) {
      return validationErrorResult("No se pudo resolver el id_persona del empleado.");
    }

    const personaResult = await PersonaService.update(idPersona, personaPayload, authUserId);

    if (!personaResult.success) {
      return personaResult;
    }

    result.persona = personaResult.data;
  }

  if (empleadoPayload) {
    const empleadoResult = await baseService.update(idOrParams, empleadoPayload, authUserId);

    if (!empleadoResult.success) {
      return empleadoResult;
    }

    result.empleado = empleadoResult.data;
  } else if (currentEmpleado) {
    result.empleado = currentEmpleado;
  }

  return {
    success: true,
    message: "Empleado actualizado correctamente.",
    data: result,
  };
}

module.exports = {
  ...baseService,
  create,
  update,
};
