const getRequestMeta = require("./getRequestMeta");
const defaultLogger = require("../../../logs/logger");

function sendServerInternalError(
  req,
  loggerObj = defaultLogger,
  eventName = "unnamed_event",
  startedAt = Date.now(),
  moduleName = "unnamed_module",
  error = {}
) {
  const reqInfo = (req) ? getRequestMeta(req) : {};
  
  loggerObj.error(
    {
      event: `${eventName}_internal_error`,
      reqInfo,
      durationMs: Date.now() - startedAt,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
    },
    `Error interno en ${moduleName}`
  );
}

module.exports = sendServerInternalError;
