const ActionLogRepository = require("../repository/action_log.repository");
const createCrudService = require("../../../shared/service/createCrudService");
const sendServerInternalError = require("../../../shared/utils/sendServerInternalError");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "ActionLogService" });

const crudService = createCrudService({
  Repository: ActionLogRepository,
  entityName: "action_log",
  serviceName: "ActionLogService",
});

function normalizeActionLogPayload(payload = {}) {
  const metadata = payload.metadata && typeof payload.metadata === "object"
    ? payload.metadata
    : {};

  return {
    id_sesion: payload.id_sesion || payload.idSesion || payload.sessionId,
    tipo_accion: payload.tipo_accion || payload.tipoAccion || payload.actionType,
    severidad: payload.severidad || payload.severity || "INFO",
    entity_schema: payload.entity_schema || payload.entitySchema || null,
    entity_table: payload.entity_table || payload.entityTable || null,
    entity_pk: payload.entity_pk || payload.entityPK || payload.entityPk || null,
    user_agent: payload.user_agent || payload.userAgent || null,
    metadata,
    success: payload.success ?? true,
  };
}

async function createActionLog(payload = {}, authUserId = null) {
  const startedAt = Date.now();
  const eventName = "action_log_create_internal";
  const moduleName = "ActionLogService.createActionLog";

  try {
    const actionLogPayload = normalizeActionLogPayload(payload);

    if (!actionLogPayload.id_sesion) {
      return {
        success: false,
        statusCode: 400,
        message: "No se pudo crear el action log: id_sesion es obligatorio.",
      };
    }

    if (!actionLogPayload.tipo_accion) {
      return {
        success: false,
        statusCode: 400,
        message: "No se pudo crear el action log: tipo_accion es obligatorio.",
      };
    }

    const result = await ActionLogRepository.create(actionLogPayload, authUserId);

    return {
      success: true,
      message: "Action log creado correctamente.",
      data: result,
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al crear action log.",
    };
  }
}

module.exports = {
  ...crudService,
  createActionLog,
};
