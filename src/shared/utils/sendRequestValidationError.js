const getRequestMeta = require("./getRequestMeta");
const defaultLogger = require("../../../logs/logger");

function sendRequestValidationError(
  req,
  loggerObj = defaultLogger,
  eventName = "unnamed_event",
  startedAt = Date.now(),
  schemaResult = {}
) {
  loggerObj.warn(
    {
      event: `${eventName}_validation_failed`,
      ...getRequestMeta(req),
      durationMs: Date.now() - startedAt,
      validationErrors: schemaResult?.error?.flatten?.() || "No validation info available",
    },
    "Validación fallida"
  );
}

module.exports = sendRequestValidationError;
