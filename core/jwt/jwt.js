const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id_persona,
      nombre_usuario: user.nombre_usuario,
      tipo_usuario: user.tipo_usuario || "user",
      tokenUse: "access",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id_persona,
      nombre_usuario: user.nombre_usuario,
      tipo_usuario: user.tipo_usuario || "user",
      tokenUse: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function generateSessionToken(sesion){
  return jwt.sign(
    {
      sub: sesion,
    },
    process.env.SESSION_TOKEN,
    {
      expiresIn: "8h",
    }
  )
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateSessionToken,
};