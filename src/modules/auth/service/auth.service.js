const AuthRepository = require("../repository/auth.repository");
const sha2 = require("../../../../core/sha2/sha2");
const { verifyRefreshToken } = require("../../../../core/jwt/jwt");
const mainLogger = require("../../../../logs/logger");

const toPlain = require("../../../shared/utils/toPlain");
const safeCompare = require("../../../shared/utils/safeCompare");
const removeSensitiveFields = require("../../../shared/utils/removeSensitiveFields");
const sendServerInternalError = require("../../../shared/utils/sendServerInternalError");

const logger = mainLogger.child({ module: "AuthService" });

function getIdPersona(user = {}) {
  return user.id_persona || user.idPersona || user.sub || null;
}

function normalizeSafeUser(userInstance) {
  const user = toPlain(userInstance);
  if (!user) return null;

  const safeUser = removeSensitiveFields(user);

  return {
    ...safeUser,
    id_persona: safeUser.id_persona || safeUser.idPersona,
    idPersona: safeUser.idPersona || safeUser.id_persona,
  };
}

async function login({ email, password, IPAdress, userAgent }) {
  const startedAt = Date.now();
  const eventName = "auth_login";
  const moduleName = "AuthService.login";

  try {
    const userInstance = await AuthRepository.getUserByEmail(email);

    if (!userInstance) {
      return {
        success: false,
        statusCode: 401,
        message: "Credenciales inválidas.",
      };
    }

    const user = toPlain(userInstance);
    const encodedPassword = sha2.sha2Encode(password);
    const storedPassword =
      user.contrasena_hash ||
      user.password_hash ||
      user.passwordHash ||
      user.password;

    if (!storedPassword || !safeCompare(encodedPassword, storedPassword)) {
      return {
        success: false,
        statusCode: 401,
        message: "Credenciales inválidas.",
      };
    }

    const idPersona = getIdPersona(user);
    const safeUser = normalizeSafeUser(user);

    const newSession = await createSesion({
      idPersona,
      IPAdress,
      userAgent,
    });

    if (!newSession.success) {
      return {
        success: false,
        statusCode: newSession.statusCode || 500,
        message: newSession.message,
      };
    }

    return {
      success: true,
      message: "Login exitoso.",
      data: {
        user: safeUser,
        session: newSession.data,
      },
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al iniciar sesión.",
    };
  }
}

async function signup(payload) {
  const startedAt = Date.now();
  const eventName = "auth_signup";
  const moduleName = "AuthService.signup";

  try {
    const userInstance = await AuthRepository.getUserByEmail(payload.email);

    if (userInstance) {
      return {
        success: false,
        statusCode: 409,
        message: "El usuario ya existe.",
      };
    }

    const encodedPassword = sha2.sha2Encode(payload.password);

    const normPayload = {
      ...payload,
      contrasena_hash: encodedPassword,
    };

    delete normPayload.password;
    delete normPayload.password_hash;

    const newUserInstance = await AuthRepository.createUser(normPayload);

    if (!newUserInstance) {
      return {
        success: false,
        statusCode: 500,
        message: "Error interno al crear usuario.",
      };
    }

    const safeUser = normalizeSafeUser(newUserInstance);

    const newToken = await requestNewToken({
      idPersona: getIdPersona(safeUser),
      accion: "VALIDAR_USUARIO",
    });

    if (!newToken.success) {
      return {
        success: false,
        statusCode: newToken.statusCode || 500,
        message: newToken.message,
      };
    }

    return {
      success: true,
      message: "Usuario creado con éxito.",
      data: safeUser,
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al crear usuario.",
    };
  }
}

async function me(idPersona) {
  const startedAt = Date.now();
  const eventName = "auth_me";
  const moduleName = "AuthService.me";

  try {
    const userInstance = await AuthRepository.getUserByIdPersona(idPersona);

    if (!userInstance) {
      return {
        success: false,
        statusCode: 404,
        message: "Usuario no encontrado.",
      };
    }

    return {
      success: true,
      message: "Usuario autenticado obtenido correctamente.",
      data: normalizeSafeUser(userInstance),
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al obtener la sesión.",
    };
  }
}

async function refreshSession(refreshToken) {
  const startedAt = Date.now();
  const eventName = "auth_refresh_session";
  const moduleName = "AuthService.refreshSession";

  try {
    if (!refreshToken) {
      return {
        success: false,
        statusCode: 401,
        message: "Refresh token no proporcionado.",
      };
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (decoded.tokenUse !== "refresh") {
      return {
        success: false,
        statusCode: 401,
        message: "Token de refresh inválido.",
      };
    }

    const idPersona = decoded.sub || decoded.id_persona || decoded.idPersona;

    const userInstance = await AuthRepository.getUserByIdPersona(idPersona);

    if (!userInstance) {
      return {
        success: false,
        statusCode: 404,
        message: "Usuario no encontrado.",
      };
    }

    return {
      success: true,
      message: "Sesión refrescada correctamente.",
      data: normalizeSafeUser(userInstance),
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 401,
      message: "Refresh token inválido o expirado.",
    };
  }
}

async function changePassword({ email, new_password, token_confirm }) {
  const startedAt = Date.now();
  const eventName = "auth_change_password";
  const moduleName = "AuthService.changePassword";

  try {
    const userInstance = await AuthRepository.getUserByEmail(email);

    if (!userInstance) {
      return {
        success: false,
        statusCode: 401,
        message: "Credenciales inválidas.",
      };
    }

    const user = toPlain(userInstance);
    const idPersona = getIdPersona(user);

    const tokenUser = await AuthRepository.getAvaiableTokensByUser(
      idPersona,
      "CAMBIAR_CONTRASENA"
    );

    if (!tokenUser) {
      return {
        success: false,
        statusCode: 400,
        message: "Token inválido o expirado.",
      };
    }

    const tokenUserPlain = toPlain(tokenUser);
    const encodedToken = sha2.sha2Encode(token_confirm);
    const storedToken = tokenUserPlain.token_hash || tokenUserPlain.token;

    if (!storedToken || !safeCompare(encodedToken, storedToken)) {
      return {
        success: false,
        statusCode: 400,
        message: "Token inválido o expirado.",
      };
    }

    const newPasswordHash = sha2.sha2Encode(new_password);
    const newUser = await AuthRepository.updateUserPassword(idPersona, newPasswordHash);

    if (!newUser) {
      return {
        success: false,
        statusCode: 500,
        message: "Sin respuesta desde repository.",
      };
    }

    await AuthRepository.markTokensAsUsed(idPersona, "CAMBIAR_CONTRASENA");

    return {
      success: true,
      message: "Contraseña actualizada correctamente.",
      data: {},
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al cambiar la contraseña.",
    };
  }
}

async function activateUser({ email, token_confirm }) {
  const startedAt = Date.now();
  const eventName = "auth_activate_user";
  const moduleName = "AuthService.activateUser";

  try {
    const userInstance = await AuthRepository.getUserByEmail(email);

    if (!userInstance) {
      return {
        success: false,
        statusCode: 401,
        message: "Credenciales inválidas.",
      };
    }

    const user = toPlain(userInstance);
    const idPersona = getIdPersona(user);

    const tokenUser = await AuthRepository.getAvaiableTokensByUser(
      idPersona,
      "VALIDAR_USUARIO"
    );

    if (!tokenUser) {
      return {
        success: false,
        statusCode: 400,
        message: "Token inválido o expirado.",
      };
    }

    const tokenUserPlain = toPlain(tokenUser);
    const encodedToken = sha2.sha2Encode(token_confirm);
    const storedToken = tokenUserPlain.token_hash || tokenUserPlain.token;

    if (!storedToken || !safeCompare(encodedToken, storedToken)) {
      return {
        success: false,
        statusCode: 400,
        message: "Token inválido o expirado.",
      };
    }

    const newUser = await AuthRepository.activateUser(idPersona);

    if (!newUser) {
      return {
        success: false,
        statusCode: 500,
        message: "Sin respuesta desde repository.",
      };
    }

    return {
      success: true,
      message: "Usuario activado correctamente.",
      data: {},
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al activar usuario.",
    };
  }
}

async function createSesion({ idPersona, IPAdress, userAgent }) {
  const startedAt = Date.now();
  const eventName = "auth_create_session";
  const moduleName = "AuthService.createSesion";

  try {
    const newSesion = await AuthRepository.createSesion({
      idPersona,
      IPAdress,
      userAgent,
    });

    if (!newSesion) {
      return {
        success: false,
        statusCode: 500,
        message: "Sin respuesta desde repository.",
      };
    }

    return {
      success: true,
      message: "Sesión creada correctamente.",
      data: newSesion,
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al crear sesión.",
    };
  }
}

async function requestNewToken({ idPersona, email, accion }) {
  const startedAt = Date.now();
  const eventName = "auth_request_new_token";
  const moduleName = "AuthService.requestNewToken";

  try {
    let idPersonaObj = idPersona;

    if (!idPersonaObj) {
      const userInstance = await AuthRepository.getUserByEmail(email);

      if (!userInstance) {
        return {
          success: false,
          statusCode: 404,
          message: "Usuario no encontrado.",
        };
      }

      idPersonaObj = getIdPersona(toPlain(userInstance));
    }

    const newToken = await AuthRepository.generateToken(idPersonaObj, accion);

    if (!newToken) {
      return {
        success: false,
        statusCode: 500,
        message: "Sin respuesta desde repository.",
      };
    }

    return {
      success: true,
      message: "Token generado correctamente.",
      data: newToken,
    };
  } catch (error) {
    sendServerInternalError(null, logger, eventName, startedAt, moduleName, error);

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al solicitar token de acción.",
    };
  }
}

module.exports = {
  login,
  signup,
  me,
  refreshSession,
  changePassword,
  activateUser,
  createSesion,
  requestNewToken,
};
