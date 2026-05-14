const EmpleadoRegistroPagoService = require("../service/empleado_registro_pago.service");
const getAuthUserId = require("../../../shared/utils/getUserId");

const sendRequestFailed = require("../../../shared/utils/sendRequestFailed");
const sendAttemptingRequest = require("../../../shared/utils/sendAttemptingRequest");
const sendRequestSuccess = require("../../../shared/utils/sendRequestSuccess");
const sendServerInternalError = require("../../../shared/utils/sendServerInternalError");

const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "empleado_registro_pago.controller" });
const MODULE_BASE_NAME = "EmpleadoRegistroPago.controller";
const ID_PARAM_NAMES = ['id_pago'];

function getIdOrParams(req) {
  if (ID_PARAM_NAMES.length === 1) {
    return req.params[ID_PARAM_NAMES[0]];
  }

  return ID_PARAM_NAMES.reduce((params, paramName) => {
    params[paramName] = req.params[paramName];
    return params;
  }, {});
}

async function create(req, res) {
  const startedAt = Date.now();
  const action = "empleado_registro_pago_creation";
  const moduleName = `${MODULE_BASE_NAME}.create`;

  try {
    sendAttemptingRequest(req, logger, action, req.body);

    const result = await EmpleadoRegistroPagoService.create(req.body, getAuthUserId(req));

    if (!result.success) {
      sendRequestFailed(req, logger, action, req.body, startedAt, result);

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message || "No se pudo crear el registro.",
        errors: result.errors || null,
      });
    }

    sendRequestSuccess(req, logger, action, startedAt, result);

    return res.status(201).json({
      success: true,
      message: "Registro creado correctamente.",
      data: result.data,
    });
  } catch (error) {
    sendServerInternalError(req, logger, action, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
    });
  }
}

async function update(req, res) {
  const startedAt = Date.now();
  const action = "empleado_registro_pago_update";
  const moduleName = `${MODULE_BASE_NAME}.update`;
  const idOrParams = getIdOrParams(req);

  try {
    sendAttemptingRequest(req, logger, action, {
      idOrParams,
      body: req.body,
    });

    const result = await EmpleadoRegistroPagoService.update(
      idOrParams,
      req.body,
      getAuthUserId(req)
    );

    if (!result.success) {
      sendRequestFailed(
        req,
        logger,
        action,
        { idOrParams, body: req.body },
        startedAt,
        result
      );

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message || "No se pudo actualizar el registro.",
        errors: result.errors || null,
      });
    }

    sendRequestSuccess(req, logger, action, startedAt, result);

    return res.status(200).json({
      success: true,
      message: "Registro actualizado correctamente.",
      data: result.data,
    });
  } catch (error) {
    sendServerInternalError(req, logger, action, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
    });
  }
}

async function get(req, res) {
  const startedAt = Date.now();
  const action = "empleado_registro_pago_get";
  const moduleName = `${MODULE_BASE_NAME}.get`;
  const idOrParams = getIdOrParams(req);

  try {
    sendAttemptingRequest(req, logger, action, { idOrParams });

    const result = await EmpleadoRegistroPagoService.get(idOrParams);

    if (!result.success) {
      sendRequestFailed(req, logger, action, { idOrParams }, startedAt, result);

      return res.status(result.statusCode || 404).json({
        success: false,
        message: result.message || "Registro no encontrado.",
        errors: result.errors || null,
      });
    }

    sendRequestSuccess(req, logger, action, startedAt, result);

    return res.status(200).json({
      success: true,
      message: "Registro obtenido correctamente.",
      data: result.data,
    });
  } catch (error) {
    sendServerInternalError(req, logger, action, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
    });
  }
}

async function list(req, res) {
  const startedAt = Date.now();
  const action = "empleado_registro_pago_list";
  const moduleName = `${MODULE_BASE_NAME}.list`;

  try {
    sendAttemptingRequest(req, logger, action, { query: req.query });

    const result = await EmpleadoRegistroPagoService.list(req.query);

    if (!result.success) {
      sendRequestFailed(req, logger, action, { query: req.query }, startedAt, result);

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message || "No se pudo listar los registros.",
        errors: result.errors || null,
      });
    }

    sendRequestSuccess(req, logger, action, startedAt, result);

    return res.status(200).json({
      success: true,
      message: "Registros listados correctamente.",
      data: result.data,
      pagination: result.pagination || null,
    });
  } catch (error) {
    sendServerInternalError(req, logger, action, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
    });
  }
}

module.exports = {
  create,
  update,
  get,
  list,
};
