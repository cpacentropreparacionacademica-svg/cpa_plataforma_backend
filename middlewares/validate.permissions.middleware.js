const permissionsAuthService = require("../src/modules/auth/service/auth.permissions.service");
const sendServerInternalError = require("../src/shared/utils/sendServerInternalError");
const sendRequestFailed = require("../src/shared/utils/sendRequestFailed");
const sendRequestSuccess = require("../src/shared/utils/sendRequestSuccess");
const getAuthUserId = require("../src/shared/utils/getUserId");

const mainLogger = require("../logs/logger");
const logger = mainLogger.child({ module: "requirePermission.middleware" });

function requirePermission(accionCode) {
  return async function reqPermissions(req, res, next) {
    const startedAt = Date.now();
    const eventName = "middleware_permissions";
    const moduleName = "MiddlewarePermissions.requirePermission";

    try {
      const idPersona = getAuthUserId(req);

      if (!idPersona) {
        const result = {
          success: false,
          statusCode: 401,
          message: "No autenticado.",
        };

        sendRequestFailed(req, logger, eventName, { accionCode }, startedAt, result);

        return res.status(401).json({
          success: false,
          message: "No autenticado.",
        });
      }

      const payload = {
        idPersona,
        accionCode,
      };

      const result = await permissionsAuthService.validatePermissions(payload);
      console.log(result);

      if (!result.success) {
        sendRequestFailed(req, logger, eventName, payload, startedAt, result);

        return res.status(result.statusCode || 403).json({
          success: false,
          message: result.message || "Permiso denegado.",
        });
      }

      req.permission = {
        accionCode,
        validated: true,
        result: result.data || null,
      };

      sendRequestSuccess(req, logger, eventName, startedAt, result);

      return next();
    } catch (error) {
      sendServerInternalError(req, logger, eventName, startedAt, moduleName, error);

      return res.status(500).json({
        success: false,
        message: "Error interno al validar permisos.",
      });
    }
  };
}

module.exports = requirePermission;
