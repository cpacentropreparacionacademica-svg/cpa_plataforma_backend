const TransaccionMovimientoCuentaRepository = require("../repository/transaccion_movimiento_cuenta.repository");
const createCrudService = require("../../../shared/service/createCrudService");

const baseService = createCrudService({
  Repository: TransaccionMovimientoCuentaRepository,
  entityName: "transaccion_movimiento_cuenta",
  serviceName: "TransaccionMovimientoCuentaService",
});

function validationErrorResult(message, errors = null) {
  return { success: false, statusCode: 400, message, errors };
}

function internalErrorResult(message) {
  return { success: false, statusCode: 500, message };
}

function getMovimientos(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.movimientos)) {
    return payload.movimientos;
  }

  return null;
}

async function create(payload, authUserId) {
  try {
    const movimientos = getMovimientos(payload);

    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return validationErrorResult("Debe enviar un batch con la forma { movimientos: [...] }.");
    }

    const rows = await TransaccionMovimientoCuentaRepository.createMany(
      movimientos,
      authUserId
    );

    return {
      success: true,
      message: "Movimientos de cuenta registrados correctamente.",
      data: {
        count: rows.length,
        rows,
      },
    };
  } catch (error) {
    return internalErrorResult("Error interno en el servicio al crear movimientos de cuenta por batch.");
  }
}

module.exports = {
  ...baseService,
  create,
};
