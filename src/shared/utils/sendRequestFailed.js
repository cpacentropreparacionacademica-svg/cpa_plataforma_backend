const getRequestMeta = require("./getRequestMeta");
const defaultLogger = require("../../../logs/logger");

function sendRequestFailed(
  req,
  loggerObj = defaultLogger,
  eventName = "unnamed_event",
  data = {},
  startedAt = Date.now(),
  serviceResult = {}
) {
  loggerObj.warn(
    {
      event: `${eventName}_failed`,
      ...getRequestMeta(req),
      data,
      statusCode: serviceResult?.statusCode || 400,
      reason: serviceResult?.message || "Sin datos",
      errors: serviceResult?.errors || "Sin información adicional",
      durationMs: Date.now() - startedAt,
    },
    `Intento de '${eventName}' fallido`
  );
}

module.exports = sendRequestFailed;
