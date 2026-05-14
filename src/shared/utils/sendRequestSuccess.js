const getRequestMeta = require("./getRequestMeta");
const defaultLogger = require("../../../logs/logger");

function sendRequestSuccess(
  req,
  loggerObj = defaultLogger,
  eventName = "unnamed_event",
  startedAt = Date.now(),
  serviceResult = {}
) {
  loggerObj.info(
    {
      event: `${eventName}_succeeded`,
      ...getRequestMeta(req),
      data: serviceResult?.data,
      durationMs: Date.now() - startedAt,
    },
    `Intento de '${eventName}' exitoso`
  );
}

module.exports = sendRequestSuccess;
