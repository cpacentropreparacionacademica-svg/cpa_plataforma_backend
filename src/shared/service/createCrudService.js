const sendServerInternalError = require("../utils/sendServerInternalError");
const rootLogger = require("../../../logs/logger");

const PROTECTED_SYSTEM_FIELDS = new Set([
  "estado_registro",
  "fecha_registro",
  "fecha_modificacion",
  "version_registro",
  "id_usuario_creador",
  "id_usuario_modificacion",
  "user_id_creacion",
  "user_id_modificacion",
  "created_at",
  "updated_at",
  "deleted_at",
]);

function toPlain(value) {
  if (!value) return value;
  if (typeof value.get === "function") return value.get({ plain: true });
  if (typeof value.toJSON === "function") return value.toJSON();
  return value;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanObject(value = {}, options = {}) {
  const stripProtected = options.stripProtected !== false;

  return Object.entries(value).reduce((acc, [key, fieldValue]) => {
    if (fieldValue === undefined) return acc;
    if (stripProtected && PROTECTED_SYSTEM_FIELDS.has(key)) return acc;
    acc[key] = fieldValue;
    return acc;
  }, {});
}

function hasValues(payload = {}) {
  return Object.keys(payload).length > 0;
}

function normalizeIdOrParams(idOrParams) {
  if (isPlainObject(idOrParams)) {
    return cleanObject(idOrParams, { stripProtected: false });
  }

  return idOrParams;
}

function hasMissingIdentifier(idOrParams) {
  if (idOrParams === undefined || idOrParams === null || idOrParams === "") {
    return true;
  }

  if (!isPlainObject(idOrParams)) {
    return false;
  }

  const values = Object.values(idOrParams);
  return values.length === 0 || values.some((value) => value === undefined || value === null || value === "");
}

async function runHook(hook, args) {
  if (typeof hook !== "function") {
    return { success: true, data: args.payload };
  }

  const result = await hook(args);

  if (!result) {
    return { success: true, data: args.payload };
  }

  return result;
}

function internalErrorResult(message) {
  return {
    success: false,
    statusCode: 500,
    message,
  };
}

function validationErrorResult(message, errors = null) {
  return {
    success: false,
    statusCode: 400,
    message,
    errors,
  };
}

function notFoundResult(entityName) {
  return {
    success: false,
    statusCode: 404,
    message: `No se encontró el registro de ${entityName}.`,
  };
}

function createCrudService({
  Repository,
  entityName,
  serviceName,
  hooks = {},
}) {
  if (!Repository) {
    throw new Error("createCrudService requiere un Repository válido.");
  }

  if (!entityName) {
    throw new Error("createCrudService requiere entityName.");
  }

  const logger = rootLogger.child({ module: serviceName || `${entityName}.service` });

  async function create(payload, authUserId) {
    const startedAt = Date.now();
    const eventName = `${entityName}_create`;
    const moduleName = `${serviceName}.create`;

    try {
      if (!isPlainObject(payload)) {
        return validationErrorResult("El payload de creación debe ser un objeto válido.");
      }

      let cleanPayload = cleanObject(payload);

      if (!hasValues(cleanPayload)) {
        return validationErrorResult("No existen campos válidos para crear el registro.");
      }

      const hookResult = await runHook(hooks.beforeCreate, {
        payload: cleanPayload,
        authUserId,
        Repository,
        entityName,
      });

      if (!hookResult.success) {
        return hookResult;
      }

      cleanPayload = hookResult.data || cleanPayload;

      const result = await Repository.create(cleanPayload, authUserId);

      if (!result) {
        return internalErrorResult("Sin respuesta desde repository al crear el registro.");
      }

      const plainResult = toPlain(result);

      const afterHook = await runHook(hooks.afterCreate, {
        payload: cleanPayload,
        result: plainResult,
        authUserId,
        Repository,
        entityName,
      });

      if (!afterHook.success) {
        return afterHook;
      }

      return {
        success: true,
        message: "Registro creado correctamente.",
        data: afterHook.data || plainResult,
      };
    } catch (error) {
      sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

      return internalErrorResult("Error interno en el servicio al crear el registro.");
    }
  }

  async function update(idOrParams, payload, authUserId) {
    const startedAt = Date.now();
    const eventName = `${entityName}_update`;
    const moduleName = `${serviceName}.update`;

    try {
      const normalizedId = normalizeIdOrParams(idOrParams);

      if (hasMissingIdentifier(normalizedId)) {
        return validationErrorResult("El identificador del registro es obligatorio.");
      }

      if (!isPlainObject(payload)) {
        return validationErrorResult("El payload de actualización debe ser un objeto válido.");
      }

      let cleanPayload = cleanObject(payload);

      if (!hasValues(cleanPayload)) {
        return validationErrorResult("No existen campos válidos para actualizar el registro.");
      }

      const currentRecord = await Repository.get(normalizedId);

      if (!currentRecord) {
        return notFoundResult(entityName);
      }

      const hookResult = await runHook(hooks.beforeUpdate, {
        idOrParams: normalizedId,
        payload: cleanPayload,
        currentRecord: toPlain(currentRecord),
        authUserId,
        Repository,
        entityName,
      });

      if (!hookResult.success) {
        return hookResult;
      }

      cleanPayload = hookResult.data || cleanPayload;

      const result = await Repository.update(normalizedId, cleanPayload, authUserId);

      if (!result) {
        return notFoundResult(entityName);
      }

      const plainResult = toPlain(result);

      const afterHook = await runHook(hooks.afterUpdate, {
        idOrParams: normalizedId,
        payload: cleanPayload,
        previousRecord: toPlain(currentRecord),
        result: plainResult,
        authUserId,
        Repository,
        entityName,
      });

      if (!afterHook.success) {
        return afterHook;
      }

      return {
        success: true,
        message: "Registro actualizado correctamente.",
        data: afterHook.data || plainResult,
      };
    } catch (error) {
      sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

      return internalErrorResult("Error interno en el servicio al actualizar el registro.");
    }
  }

  async function get(idOrParams) {
    const startedAt = Date.now();
    const eventName = `${entityName}_get`;
    const moduleName = `${serviceName}.get`;

    try {
      const normalizedId = normalizeIdOrParams(idOrParams);

      if (hasMissingIdentifier(normalizedId)) {
        return validationErrorResult("El identificador del registro es obligatorio.");
      }

      const hookResult = await runHook(hooks.beforeGet, {
        idOrParams: normalizedId,
        Repository,
        entityName,
      });

      if (!hookResult.success) {
        return hookResult;
      }

      const result = await Repository.get(normalizedId);

      if (!result) {
        return notFoundResult(entityName);
      }

      return {
        success: true,
        message: "Registro obtenido correctamente.",
        data: toPlain(result),
      };
    } catch (error) {
      sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

      return internalErrorResult("Error interno en el servicio al obtener el registro.");
    }
  }

  async function list(query = {}) {
    const startedAt = Date.now();
    const eventName = `${entityName}_list`;
    const moduleName = `${serviceName}.list`;

    try {
      const cleanQuery = isPlainObject(query)
        ? cleanObject(query, { stripProtected: false })
        : {};

      const hookResult = await runHook(hooks.beforeList, {
        query: cleanQuery,
        Repository,
        entityName,
      });

      if (!hookResult.success) {
        return hookResult;
      }

      const finalQuery = hookResult.data || cleanQuery;
      const result = await Repository.list(finalQuery);

      if (!result) {
        return internalErrorResult("Sin respuesta desde repository al listar registros.");
      }

      const plainResult = toPlain(result);

      return {
        success: true,
        message: "Registros listados correctamente.",
        data: plainResult,
        pagination: plainResult && typeof plainResult === "object"
          ? {
              count: plainResult.count ?? null,
              limit: plainResult.limit ?? null,
              offset: plainResult.offset ?? null,
            }
          : null,
      };
    } catch (error) {
      sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

      return internalErrorResult("Error interno en el servicio al listar registros.");
    }
  }

  return {
    create,
    update,
    get,
    list,
  };
}

module.exports = createCrudService;
