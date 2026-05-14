const ActionLogService = require("../src/modules/seguridad/service/action_log.service");
const getAuthUserId = require("../src/shared/utils/getUserId");
const rootLogger = require("../logs/logger");

const logger = rootLogger.child({ module: "actionLog.middleware" });

const SENSITIVE_KEYS = new Set([
  "password",
  "password_hash",
  "passwordHash",
  "contrasena",
  "contrasena_hash",
  "token",
  "token_hash",
  "token_plain",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
]);

function sanitize(value, depth = 0) {
  if (depth > 5) return "[MaxDepth]";
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  if (typeof value !== "object") {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, fieldValue]) => {
    if (SENSITIVE_KEYS.has(key)) {
      acc[key] = "[REDACTED]";
      return acc;
    }

    acc[key] = sanitize(fieldValue, depth + 1);
    return acc;
  }, {});
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

function decodeJwtPayloadUnsafe(token) {
  try {
    const payloadPart = String(token).split(".")[1];
    if (!payloadPart) return null;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch (_error) {
    return null;
  }
}

function extractSessionObject(value) {
  if (!value) return null;

  if (typeof value === "object") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  if (value.startsWith("j:")) {
    return safeJsonParse(value.slice(2));
  }

  const parsed = safeJsonParse(value);
  if (parsed) return parsed;

  const decodedPayload = decodeJwtPayloadUnsafe(value);
  if (decodedPayload) return decodedPayload;

  return null;
}

function extractIdSesionFromSession(sessionObject) {
  if (!sessionObject) return null;

  if (sessionObject.id_sesion) return sessionObject.id_sesion;
  if (sessionObject.idSesion) return sessionObject.idSesion;
  if (sessionObject.sessionId) return sessionObject.sessionId;

  if (sessionObject.sub && typeof sessionObject.sub === "object") {
    return extractIdSesionFromSession(sessionObject.sub);
  }

  if (sessionObject.sub && !Number.isNaN(Number(sessionObject.sub))) {
    return sessionObject.sub;
  }

  if (sessionObject.session) {
    return extractIdSesionFromSession(sessionObject.session);
  }

  if (sessionObject.data) {
    return extractIdSesionFromSession(sessionObject.data);
  }

  return null;
}

function extractIdSesion(req, responseBody) {
  const sessionFromCookie = extractSessionObject(req.cookies?.session);
  const idFromCookie = extractIdSesionFromSession(sessionFromCookie);

  if (idFromCookie) return idFromCookie;

  const idFromResponse = extractIdSesionFromSession(responseBody?.data?.session);
  if (idFromResponse) return idFromResponse;

  return null;
}

function normalizeSegment(segment) {
  return String(segment || "")
    .trim()
    .replace(/-/g, "_")
    .toLowerCase();
}

function getRouteParts(req) {
  const pathname = String(req.originalUrl || req.url || "").split("?")[0];
  const parts = pathname.split("/").filter(Boolean);
  const apiIndex = parts.indexOf("api");
  const baseIndex = apiIndex >= 0 ? apiIndex + 1 : 0;
  const moduleName = normalizeSegment(parts[baseIndex]);
  const routeGroup = normalizeSegment(parts[baseIndex + 1]);
  const operationName = normalizeSegment(parts[baseIndex + 2]);

  return {
    pathname,
    moduleName,
    entityName: moduleName === "auth" && operationName ? operationName : routeGroup,
    routeGroup,
    operationName,
    rawParts: parts,
  };
}

function inferCrudAction(req) {
  const method = String(req.method || "").toUpperCase();

  if (method === "POST") return "CREATE";
  if (method === "PUT" || method === "PATCH") return "UPDATE";
  if (method === "DELETE") return "DELETE";
  if (method === "GET") return "READ";

  return method || "UNKNOWN";
}

function buildTipoAccion(req, routeParts) {
  if (req.permission?.accionCode) {
    return req.permission.accionCode;
  }

  const moduleName = String(routeParts.moduleName || "backend").toUpperCase();
  const entityName = String(routeParts.entityName || "endpoint").toUpperCase();
  const crudAction = inferCrudAction(req);

  return `${moduleName}.${entityName}.${crudAction}`;
}

function extractEntityPK(req, responseBody, routeParts) {
  const entityPK = {};

  if (req.params && Object.keys(req.params).length > 0) {
    Object.assign(entityPK, req.params);
  }

  const pathParts = routeParts.rawParts || [];
  const possibleId = pathParts[3];

  if (possibleId && !entityPK.id) {
    entityPK.id = possibleId;
  }

  const data = responseBody?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (/^id_/i.test(key) || /^id[A-Z]/.test(key) || key === "id") {
        entityPK[key] = value;
      }
    }
  }

  return Object.keys(entityPK).length > 0 ? entityPK : null;
}

function shouldSkipActionLog(req) {
  const pathname = String(req.originalUrl || req.url || "").split("?")[0];
  const method = String(req.method || "").toUpperCase();

  if (method === "OPTIONS") return true;
  if (pathname === "/health") return true;
  if (!pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/api/seguridad/action-log")) return true;
  if (pathname.startsWith("/api/seguridad/sesion")) return true;

  return false;
}

function actionLogMiddleware(req, res, next) {
  if (shouldSkipActionLog(req)) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function patchedJson(body) {
    res.locals.responseBody = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    setImmediate(async () => {
      try {
        const responseBody = res.locals.responseBody || null;
        const idSesion = extractIdSesion(req, responseBody);

        if (!idSesion) {
          logger.warn(
            {
              event: "action_log_skipped_missing_session",
              method: req.method,
              path: req.originalUrl || req.url,
              statusCode: res.statusCode,
            },
            "No se creó action log porque no se encontró id_sesion."
          );
          return;
        }

        const routeParts = getRouteParts(req);
        const responseSuccess = responseBody?.success;
        const success = typeof responseSuccess === "boolean"
          ? responseSuccess
          : res.statusCode < 400;

        const payload = {
          id_sesion: idSesion,
          tipo_accion: buildTipoAccion(req, routeParts),
          severidad: success ? "INFO" : "ERROR",
          entity_schema: routeParts.moduleName || null,
          entity_table: routeParts.entityName || null,
          entity_pk: extractEntityPK(req, responseBody, routeParts),
          user_agent: req.headers?.["user-agent"] || null,
          success,
          metadata: sanitize({
            request: {
              method: req.method,
              path: req.originalUrl || req.url,
              params: req.params,
              query: req.query,
              body: req.body,
              ip: req.ip,
              requestId: req.id || req.headers?.["x-request-id"] || null,
              user: req.user || null,
              permission: req.permission || null,
            },
            response: {
              statusCode: res.statusCode,
              message: responseBody?.message || null,
              success,
            },
          }),
        };

        const result = await ActionLogService.createActionLog(payload, getAuthUserId(req));

        if (!result.success) {
          logger.warn(
            {
              event: "action_log_create_failed",
              message: result.message,
              statusCode: result.statusCode,
              path: req.originalUrl || req.url,
            },
            "No se pudo crear el action log."
          );
        }
      } catch (error) {
        logger.error(
          {
            event: "action_log_middleware_error",
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          },
          "Error al crear action log desde middleware."
        );
      }
    });
  });

  return next();
}

module.exports = actionLogMiddleware;
