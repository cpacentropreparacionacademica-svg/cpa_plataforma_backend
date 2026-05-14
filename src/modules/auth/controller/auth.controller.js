const AuthService = require("../service/auth.service");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../../core/jwt/jwt");

const mainLogger = require("../../../../logs/logger");
const logger = mainLogger.child({ module: "AuthController" });

const sendRequestFailed = require("../../../shared/utils/sendRequestFailed");
const sendAttemptingRequest = require("../../../shared/utils/sendAttemptingRequest");
const sendRequestSuccess = require("../../../shared/utils/sendRequestSuccess");
const sendServerInternalError = require("../../../shared/utils/sendServerInternalError");
const getClientIp = require("../../../shared/http/getIPAdress");

function getAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  };
}

function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

function getSessionTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  };
}


function clearAuthCookies(res) {
  const baseOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  res.clearCookie("access_token", baseOptions);
  res.clearCookie("refresh_token", baseOptions);
  res.clearCookie("session", baseOptions);
}

function getAuthenticatedIdPersona(req) {
  return req.user?.id_persona || req.user?.idPersona || req.user?.sub || null;
}

async function login(req, res) {
  const eventName = "login";
  const startedAt = Date.now();
  const moduleName = "auth.login";

  try {
    sendAttemptingRequest(req, logger, eventName, { email: req.body?.email });

    const IPAdress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || null;

    const result = await AuthService.login({
      ...req.body,
      IPAdress,
      userAgent,
    });

    if (!result.success) {
      sendRequestFailed(req, logger, eventName, { email: req.body?.email }, startedAt, result);

      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.message,
      });
    }

    const user = result.data.user;
    const sesion = result.data.session;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    res.cookie("access_token", accessToken, getAccessTokenCookieOptions());
    res.cookie("refresh_token", refreshToken, getRefreshTokenCookieOptions());
    res.cookie("session", sesion, getSessionTokenCookieOptions());

    sendRequestSuccess(req, logger, eventName, startedAt, result);

    return res.status(200).json({
      success: true,
      message: "Login exitoso.",
      data: {
        user,
        session: result.data.session,
        accessToken,
        tokenType: "Bearer",
      },
    });
  } catch (error) {
    sendServerInternalError(req, logger, eventName, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno al iniciar sesión.",
    });
  }
}

async function logout(req, res) {
  const startedAt = Date.now();
  const eventName = "logout";
  const moduleName = "auth.logout";

  try {
    sendAttemptingRequest(req, logger, eventName, {});

    clearAuthCookies(res);

    sendRequestSuccess(req, logger, eventName, startedAt, {
      success: true,
      message: "Sesión cerrada correctamente.",
    });

    return res.status(200).json({
      success: true,
      message: "Sesión cerrada correctamente.",
    });
  } catch (error) {
    sendServerInternalError(req, logger, eventName, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno al cerrar sesión.",
    });
  }
}

async function signup(req, res) {
  const startedAt = Date.now();
  const eventName = "signup";
  const moduleName = "auth.signup";

  try {
    sendAttemptingRequest(req, logger, eventName, {
      email: req.body?.email,
    });

    const result = await AuthService.signup(req.body);

    if (!result || typeof result.success !== "boolean") {
      throw new Error("AuthService.signup devolvió una respuesta inválida.");
    }

    if (!result.success) {
      sendRequestFailed(
        req,
        logger,
        eventName,
        {
          email: req.body?.email,
        },
        startedAt,
        result
      );

      const status = result.statusHttp || result.statusCode || 400;

      return res.status(status).json({
        success: false,
        message: result.message || "No se pudo crear el usuario.",
        errorCode: result.errorCode,
      });
    }

    sendRequestSuccess(req, logger, eventName, startedAt, result);

    return res.status(201).json({
      success: true,
      message: result.message || "Usuario creado correctamente.",
      data: {
        user: result.data,
      },
    });
  } catch (error) {
    sendServerInternalError(
      req,
      logger,
      eventName,
      startedAt,
      moduleName,
      error
    );

    return res.status(500).json({
      success: false,
      message: "Error interno al crear usuario.",
      errorCode: "AUTH_SIGNUP_INTERNAL_ERROR",
    });
  }
} 
async function changePassword(req, res) {
  const startedAt = Date.now();
  const eventName = "change_password";
  const moduleName = "auth.changePassword";

  try {
    sendAttemptingRequest(req, logger, eventName, { email: req.body?.email });

    const result = await AuthService.changePassword(req.body);

    if (!result.success) {
      sendRequestFailed(req, logger, eventName, { email: req.body?.email }, startedAt, result);

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    sendRequestSuccess(req, logger, eventName, startedAt, result);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    sendServerInternalError(req, logger, eventName, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno al cambiar la contraseña.",
    });
  }
}

async function activateUser(req, res) {
  const startedAt = Date.now();
  const eventName = "activate_user";
  const moduleName = "auth.activateUser";

  try {
    sendAttemptingRequest(req, logger, eventName, { email: req.body?.email });

    const result = await AuthService.activateUser(req.body);

    if (!result.success) {
      sendRequestFailed(req, logger, eventName, { email: req.body?.email }, startedAt, result);

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    sendRequestSuccess(req, logger, eventName, startedAt, result);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    sendServerInternalError(req, logger, eventName, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno al activar usuario.",
    });
  }
}

async function me(req, res) {
  const startedAt = Date.now();
  const eventName = "me";
  const moduleName = "auth.me";

  try {
    const idPersona = getAuthenticatedIdPersona(req);

    if (!idPersona) {
      const result = {
        success: false,
        statusCode: 401,
        message: "No autorizado. Usuario no encontrado en el token.",
      };

      sendRequestFailed(req, logger, eventName, {}, startedAt, result);

      return res.status(401).json({
        success: false,
        message: result.message,
      });
    }

    sendAttemptingRequest(req, logger, eventName, { idPersona });

    const result = await AuthService.me(idPersona);

    if (!result.success) {
      sendRequestFailed(req, logger, eventName, { idPersona }, startedAt, result);

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    sendRequestSuccess(req, logger, eventName, startedAt, result);

    return res.status(200).json({
      success: true,
      message: "Sesión obtenida correctamente.",
      data: {
        user: result.data,
      },
    });
  } catch (error) {
    sendServerInternalError(req, logger, eventName, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno al obtener la sesión.",
    });
  }
}

async function refreshSession(req, res) {
  const startedAt = Date.now();
  const eventName = "refresh_session";
  const moduleName = "auth.refreshSession";

  try {
    const refreshToken = req.cookies?.refresh_token;

    sendAttemptingRequest(req, logger, eventName, {});

    const result = await AuthService.refreshSession(refreshToken);

    if (!result.success) {
      sendRequestFailed(req, logger, eventName, {}, startedAt, result);

      clearAuthCookies(res);

      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.message,
      });
    }

    const newAccessToken = generateAccessToken(result.data);
    const newRefreshToken = generateRefreshToken(result.data);

    res.cookie("access_token", newAccessToken, getAccessTokenCookieOptions());
    res.cookie("refresh_token", newRefreshToken, getRefreshTokenCookieOptions());

    sendRequestSuccess(req, logger, eventName, startedAt, result);

    return res.status(200).json({
      success: true,
      message: "Sesión refrescada correctamente.",
      data: {
        user: result.data,
        accessToken: newAccessToken,
        tokenType: "Bearer",
      },
    });
  } catch (error) {
    clearAuthCookies(res);

    sendServerInternalError(req, logger, eventName, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno al refrescar la sesión.",
    });
  }
}

async function requestNewPasswordToken(req, res) {
  const startedAt = Date.now();
  const eventName = "request_new_password_token";
  const moduleName = "auth.requestNewPasswordToken";

  try {
    sendAttemptingRequest(req, logger, eventName, { email: req.body?.email });

    const result = await AuthService.requestNewToken({
      ...req.body,
      accion: "CAMBIAR_CONTRASENA",
    });

    if (!result.success) {
      sendRequestFailed(req, logger, eventName, { email: req.body?.email }, startedAt, result);

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    const logResult = {
      ...result,
      data: {
        id_token_accion: result.data?.id_token_accion,
        fecha_expiracion: result.data?.fecha_expiracion,
        accion: result.data?.accion,
      },
    };

    sendRequestSuccess(req, logger, eventName, startedAt, logResult);

    return res.status(200).json({
      success: true,
      message: "Token generado correctamente.",
      data: process.env.NODE_ENV === "production" ? undefined : result.data,
    });
  } catch (error) {
    sendServerInternalError(req, logger, eventName, startedAt, moduleName, error);

    return res.status(500).json({
      success: false,
      message: "Error interno al solicitar token de recuperación.",
    });
  }
}

module.exports = {
  login,
  logout,
  signup,
  changePassword,
  activateUser,
  me,
  refreshSession,
  requestNewPasswordToken,
};
