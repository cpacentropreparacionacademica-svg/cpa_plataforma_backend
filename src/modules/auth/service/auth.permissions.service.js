const AuthRepository = require("../repository/auth.repository");
const sendServerInternalError = require("../../../shared/utils/sendServerInternalError");
const mainLogger = require("../../../../logs/logger");
const logger = mainLogger.child({ module: "AuthServicePermissions" });
const toPlain = require("../../../shared/utils/toPlain");

function hasSuperUserFlag(user = {}) {
  return user.es_super_usuario === true || user.es_super_usuario === "true" || user.tipo_usuario === "SUPER_ADMIN";
}

function buildPermissionCandidates(accionCode) {
  const parts = String(accionCode || "").split(".");

  if (parts.length !== 3) {
    return [accionCode];
  }

  const [moduleName, modelName, actionName] = parts;

  return [
    `${moduleName}.${modelName}.${actionName}`,
    `${moduleName}.${modelName}.*`,
    `${moduleName}.*.${actionName}`,
    `${moduleName}.*.*`,
    `*.${modelName}.${actionName}`,
    `*.*.${actionName}`,
    `*.*.*`,
  ];
}

async function getPermissions({ idPersona }) {
  const startedAt = Date.now();
  const eventName = "auth_get_permissions";
  const moduleName = "AuthServicePermissions.getPermissions";

  try {
    if (!idPersona) {
      return {
        success: false,
        statusCode: 401,
        message: "El idPersona es obligatorio.",
      };
    }

    const userInstance = await AuthRepository.getUserByIdPersona(idPersona);

    if (!userInstance) {
      return {
        success: false,
        statusCode: 404,
        message: "Usuario no encontrado.",
      };
    }

    const user = toPlain(userInstance);
    const permissions = await AuthRepository.getPermissionsByAnySource(idPersona);

    return {
      success: true,
      message: "Permisos obtenidos exitosamente.",
      data: {
        user,
        idPersona,
        permissions: permissions || [],
      },
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al obtener permisos.",
    };
  }
}

async function validatePermissions({ idPersona, accionCode }) {
  const startedAt = Date.now();
  const eventName = "auth_validate_permission";
  const moduleName = "AuthServicePermissions.validatePermissions";

  try {
    if (!idPersona) {
      return {
        success: false,
        statusCode: 401,
        message: "Usuario no autenticado.",
      };
    }

    if (!accionCode) {
      return {
        success: false,
        statusCode: 500,
        message: "La acción requerida no fue configurada.",
      };
    }


    const result = await getPermissions({ idPersona });
    const resultSuperUser = await AuthRepository.isSuperUser({idPersona});

    if (!result) {
      return {
        success: false,
        statusCode: result.statusCode || 403,
        message: result.message,
      };
    }

    console.log(resultSuperUser);
    if (!resultSuperUser) {
      return {
        success: false,
        message: "No es super usuario ni tiene permisos",
      };
    }


    const user = result.data?.user || {};

    if (hasSuperUserFlag(user) || resultSuperUser.data) {
      return {
        success: true,
        message: "Permiso validado correctamente por super usuario.",
        data: {
          idPersona,
          accionCode,
          bypass: "SUPER_USER",
        },
      };
    }

    const permissions = result.data?.permissions || [];
    const permissionCandidates = new Set(buildPermissionCandidates(accionCode));

    const hasPermission = permissions.some((permission) => {
      const plainPermission = toPlain(permission);

      return permissionCandidates.has(plainPermission?.codigo);
    });

    if (!hasPermission) {
      return {
        success: false,
        statusCode: 403,
        message: "No tienes permisos para realizar esta acción.",
      };
    }

    return {
      success: true,
      message: "Permiso validado correctamente.",
      data: {
        idPersona,
        accionCode,
      },
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al validar permisos.",
    };
  }
}

module.exports = {
  getPermissions,
  validatePermissions,
};
