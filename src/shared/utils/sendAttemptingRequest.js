const getRequestMeta = require("./getRequestMeta");
const defaultLogger = require("../../../logs/logger");

function sendAttemptingRequest(
  req,
  loggerObj = defaultLogger,
  eventName = "unnamed_event",
  data = {}
) {
  loggerObj.info(
    {
      event: `${eventName}_attempt`,
      ...getRequestMeta(req),
      data,
    },
    `Intento de '${eventName}'`
  );
}

module.exports = sendAttemptingRequest;
