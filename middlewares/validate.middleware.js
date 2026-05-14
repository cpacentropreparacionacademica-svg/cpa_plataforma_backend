const defaultLogger = require("../logs/logger");
const sendRequestValidationError = require("../src/shared/utils/sendRequestValidationError");

function validateBody(schema, loggerObj = defaultLogger, eventName = "unnamed_event") {
  return (req, res, next) => {
    const startedAt = Date.now();
    const result = schema.safeParse(req.body);

    if (!result.success) {
      sendRequestValidationError(req, loggerObj, eventName, startedAt, result);

      return res.status(400).json({
        success: false,
        message: "Datos inválidos.",
        errors: result.error.flatten(),
      });
    }

    req.body = result.data;
    return next();
  };
}

function validateParams(schema, loggerObj = defaultLogger, eventName = "unnamed_event") {
  return (req, res, next) => {
    const startedAt = Date.now();
    const result = schema.safeParse(req.params);

    if (!result.success) {
      sendRequestValidationError(req, loggerObj, eventName, startedAt, result);

      return res.status(400).json({
        success: false,
        message: "Parámetros inválidos.",
        errors: result.error.flatten(),
      });
    }

    req.params = result.data;
    return next();
  };
}

function validateQuery(schema, loggerObj = defaultLogger, eventName = "unnamed_event") {
  return (req, res, next) => {
    const startedAt = Date.now();
    const result = schema.safeParse(req.query);

    if (!result.success) {
      sendRequestValidationError(req, loggerObj, eventName, startedAt, result);

      return res.status(400).json({
        success: false,
        message: "Query inválida.",
        errors: result.error.flatten(),
      });
    }

    req.query = result.data;
    return next();
  };
}

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
};
