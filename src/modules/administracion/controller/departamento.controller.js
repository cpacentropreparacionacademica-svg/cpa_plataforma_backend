const DepartamentoService = require("../service/departamento.service");
const getAuthUserId = require("../../../shared/utils/getUserId");

const sendRequestFailed = require("../../../shared/utils/sendRequestFailed");
const sendAttemptingRequest = require("../../../shared/utils/sendAttemptingRequest");
const sendRequestSuccess = require("../../../shared/utils/sendRequestSuccess");
const sendServerInternalError = require("../../../shared/utils/sendServerInternalError");

const rootLogger = require("../../../../logs/logger");
const logger = rootLogger.child({ module: "departamento.controller" });
const MODULE_BASE_NAME = "Departamento.controller";

async function create(req, res) {
  const startedAt = Date.now();
  const action = "department_creation";
  const moduleName = `${MODULE_BASE_NAME}.create`;

  try {
    sendAttemptingRequest(req, logger, action, req.body);

    const result = await DepartamentoService.create(
      req.body,
      getAuthUserId(req)
    );

    if (!result.success) {
      sendRequestFailed(req, logger, action, req.body, startedAt, result);

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message || "No se pudo crear el departamento.",
        errors: result.errors || null,
      });
    }

    sendRequestSuccess(req, logger, action, startedAt, result);

    return res.status(201).json({
      success: true,
      message: "Departamento creado correctamente.",
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
  const action = "department_update";
  const moduleName = `${MODULE_BASE_NAME}.update`;

  const id_departamento = req.params.id_departamento || req.params.id;

  try {
    sendAttemptingRequest(req, logger, action, {
      id_departamento,
      body: req.body,
    });

    const result = await DepartamentoService.update(
      id_departamento,
      req.body,
      getAuthUserId(req)
    );

    if (!result.success) {
      sendRequestFailed(
        req,
        logger,
        action,
        {
          id_departamento,
          body: req.body,
        },
        startedAt,
        result
      );

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message || "No se pudo actualizar el departamento.",
        errors: result.errors || null,
      });
    }

    sendRequestSuccess(req, logger, action, startedAt, result);

    return res.status(200).json({
      success: true,
      message: "Departamento actualizado correctamente.",
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
  const action = "department_get";
  const moduleName = `${MODULE_BASE_NAME}.get`;

  const id_departamento = req.params.id_departamento || req.params.id;

  try {
    sendAttemptingRequest(req, logger, action, {
      id_departamento,
    });

    const result = await DepartamentoService.get(id_departamento);

    if (!result.success) {
      sendRequestFailed(
        req,
        logger,
        action,
        {
          id_departamento,
        },
        startedAt,
        result
      );

      return res.status(result.statusCode || 404).json({
        success: false,
        message: result.message || "Departamento no encontrado.",
        errors: result.errors || null,
      });
    }

    sendRequestSuccess(req, logger, action, startedAt, result);

    return res.status(200).json({
      success: true,
      message: "Departamento obtenido correctamente.",
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
  const action = "department_list";
  const moduleName = `${MODULE_BASE_NAME}.list`;

  try {
    sendAttemptingRequest(req, logger, action, {
      query: req.query,
    });

    const result = await DepartamentoService.list(req.query);

    if (!result.success) {
      sendRequestFailed(
        req,
        logger,
        action,
        {
          query: req.query,
        },
        startedAt,
        result
      );

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message || "No se pudo listar los departamentos.",
        errors: result.errors || null,
      });
    }

    sendRequestSuccess(req, logger, action, startedAt, result);

    return res.status(200).json({
      success: true,
      message: "Departamentos listados correctamente.",
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

module.exports = {
  create,
  update,
  get,
  list,
};