const { verifyAccessToken } = require("../core/jwt/jwt");

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    const tokenFromHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const tokenFromCookie = req.cookies?.access_token;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No autorizado. Token de acceso no proporcionado.",
      });
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      id_persona: decoded.id_persona || decoded.sub || null,
      id_usuario: decoded.id_usuario || null,
      nombre_usuario: decoded.nombre_usuario || decoded.email || null,
      email: decoded.email || null,
      tipo_usuario: decoded.tipo_usuario || decoded.role || "user",
      role: decoded.role || decoded.tipo_usuario || "user",
      tokenUse: decoded.tokenUse,
    };

    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado.",
    });
  }
}

module.exports = {
  requireAuth,
};
