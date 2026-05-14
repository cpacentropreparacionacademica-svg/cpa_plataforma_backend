const crypto = require("crypto");
const { Op, QueryTypes } = require("sequelize");

const { sequelize } = require("../../../../core/db/db.config");
const {
  Persona,
  PersonaUsuario,
  Sesion,
  UsuarioTokenAccion,
} = require("../../../../core/db/db.associations");

const sha2 = require("../../../../core/sha2/sha2");

function toPlain(value) {
  if (!value) return null;
  if (typeof value.get === "function") return value.get({ plain: true });
  if (typeof value.toJSON === "function") return value.toJSON();
  return { ...value };
}

function normalizeUser(userInstance) {
  const user = toPlain(userInstance);
  if (!user) return null;

  const persona = user.persona || {};

  return {
    ...user,
    idPersona: user.id_persona,
    email: user.email || persona.email || null,
    nombres: user.nombres || persona.nombres || null,
    apellidos: user.apellidos || persona.apellidos || null,
    telefono: user.telefono || persona.telefono || null,
    contrasena_hash: user.contrasena_hash,
    password_hash: user.contrasena_hash,
  };
}

function normalizeUserCreatePayload(payload = {}) {
  return {
    id_persona: payload.id_persona || payload.idPersona,
    nombre_usuario: payload.nombre_usuario,
    contrasena_hash:
      payload.contrasena_hash ||
      payload.password_hash ||
      payload.passwordHash,
    tipo_usuario: payload.tipo_usuario || null,
    es_super_usuario: Boolean(payload.es_super_usuario),
    id_usuario_creador: payload.id_usuario_creador || null,
  };
}

async function getUserByEmail(email) {
  if (!email) return null;

  const userInstance = await PersonaUsuario.findOne({
    include: [
      {
        model: Persona,
        as: "persona",
        required: true,
        where: {
          email: { [Op.iLike]: String(email).trim() },
        },
      },
    ],
  });

  return normalizeUser(userInstance);
}

async function getUserById(idPersona) {
  if (!idPersona) return null;

  const userInstance = await PersonaUsuario.findByPk(idPersona, {
    include: [
      {
        model: Persona,
        as: "persona",
        required: false,
      },
    ],
  });

  return normalizeUser(userInstance);
}

async function getUserByIdPersona(idPersona) {
  return getUserById(idPersona);
}

async function createUser(payload) {
  const createPayload = normalizeUserCreatePayload(payload);

  if (!createPayload.id_persona || !createPayload.nombre_usuario || !createPayload.contrasena_hash) {
    return null;
  }

  const userInstance = await PersonaUsuario.create(createPayload);

  return getUserById(userInstance.id_persona);
}

async function updateUserPassword(idPersona, newPasswordHash) {
  if (!idPersona || !newPasswordHash) return null;

  const [affectedRows, rows] = await PersonaUsuario.update(
    {
      contrasena_hash: newPasswordHash,
      fecha_modificacion: new Date(),
    },
    {
      where: { id_persona: idPersona },
      returning: true,
    }
  );

  if (affectedRows === 0) return null;

  return normalizeUser(rows?.[0]) || getUserById(idPersona);
}

async function activateUser(idPersona) {
  if (!idPersona) return null;

  const [affectedRows, rows] = await PersonaUsuario.update(
    {
      estado_registro: "Activo",
      fecha_modificacion: new Date(),
    },
    {
      where: { id_persona: idPersona },
      returning: true,
    }
  );

  if (affectedRows === 0) return null;

  await markTokensAsUsed(idPersona, "VALIDAR_USUARIO");

  return normalizeUser(rows?.[0]) || getUserById(idPersona);
}

async function createSesion({ idPersona, IPAdress, userAgent }) {
  if (!idPersona) return null;

  const session = await Sesion.create({
    id_persona: idPersona,
    ip_acceso: IPAdress || null,
    user_agent: userAgent || null,
    tipo_login: "PASSWORD",
    esta_activa: true,
    metadata: {},
  });

  return toPlain(session);
}

async function getAvaiableTokensByUser(idPersona, accion) {
  if (!idPersona || !accion) return null;

  const tokenInstance = await UsuarioTokenAccion.findOne({
    where: {
      id_persona: idPersona,
      accion,
      fecha_usado: null,
      fecha_revocado: null,
      fecha_expiracion: {
        [Op.gt]: new Date(),
      },
      estado_registro: {
        [Op.in]: ["Activo", "ACTIVO", "activo"],
      },
    },
    order: [["fecha_expiracion", "DESC"]],
  });

  return toPlain(tokenInstance);
}

async function markTokensAsUsed(idPersona, accion) {
  if (!idPersona || !accion) return 0;

  const [affectedRows] = await UsuarioTokenAccion.update(
    {
      fecha_usado: new Date(),
    },
    {
      where: {
        id_persona: idPersona,
        accion,
        fecha_usado: null,
        fecha_revocado: null,
      },
    }
  );

  return affectedRows;
}

async function revokeAvailableTokens(idPersona, accion) {
  if (!idPersona || !accion) return 0;

  const [affectedRows] = await UsuarioTokenAccion.update(
    {
      fecha_revocado: new Date(),
    },
    {
      where: {
        id_persona: idPersona,
        accion,
        fecha_usado: null,
        fecha_revocado: null,
      },
    }
  );

  return affectedRows;
}

async function generateToken(idPersona, accion, options = {}) {
  if (!idPersona || !accion) return null;

  await revokeAvailableTokens(idPersona, accion);

  const tokenPlain = String(crypto.randomInt(10000, 100000));
  const tokenHash = sha2.sha2Encode(tokenPlain);
  const expiresInMinutes = Number(options.expiresInMinutes || 15);
  const fechaExpiracion = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const tokenInstance = await UsuarioTokenAccion.create({
    id_persona: idPersona,
    accion,
    token_hash: tokenHash,
    fecha_expiracion: fechaExpiracion,
    estado_registro: "Activo",
    id_usuario_creador: options.authUserId || idPersona,
  });

  const token = toPlain(tokenInstance);

  return {
    ...token,
    token: tokenPlain,
    token_plain: tokenPlain,
  };
}

async function getPermissionsByAnySource(idPersona) {
  if (!idPersona) return [];

  const permissions = await sequelize.query(
    `
    WITH direct_denied AS (
      SELECT up.id_permiso
      FROM seguridad.usuario_permiso up
      WHERE up.id_persona = :idPersona
        AND up.permitido = false
    ),
    direct_allowed AS (
      SELECT p.id_permiso, p.codigo, p.descripcion, p.modulo, 'USUARIO_PERMISO' AS fuente
      FROM seguridad.usuario_permiso up
      INNER JOIN seguridad.permiso p ON p.id_permiso = up.id_permiso
      WHERE up.id_persona = :idPersona
        AND up.permitido = true
        AND COALESCE(p.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
    ),
    role_allowed AS (
      SELECT p.id_permiso, p.codigo, p.descripcion, p.modulo, 'ROL_PERMISO' AS fuente
      FROM seguridad.usuario_rol ur
      INNER JOIN seguridad.rol r ON r.id_rol = ur.id_rol
      INNER JOIN seguridad.rol_permiso rp ON rp.id_rol = r.id_rol
      INNER JOIN seguridad.permiso p ON p.id_permiso = rp.id_permiso
      WHERE ur.id_persona = :idPersona
        AND COALESCE(ur.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
        AND COALESCE(r.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
        AND COALESCE(p.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
    ),
    combined AS (
      SELECT * FROM direct_allowed
      UNION
      SELECT * FROM role_allowed
    )
    SELECT DISTINCT c.id_permiso, c.codigo, c.descripcion, c.modulo, c.fuente
    FROM combined c
    WHERE NOT EXISTS (
      SELECT 1
      FROM direct_denied dd
      WHERE dd.id_permiso = c.id_permiso
    )
    ORDER BY c.modulo ASC NULLS LAST, c.codigo ASC;
    `,
    {
      replacements: { idPersona },
      type: QueryTypes.SELECT,
    }
  );

  return permissions;
}


async function isSuperUser({idPersona}) {  
  const user = await PersonaUsuario.findOne({
    where: {
      id_persona: idPersona,
      estado_registro: "Activo",
    },
    attributes: ["id_persona", "es_super_usuario"],
    raw: true,
  });

  return Boolean(user?.es_super_usuario);
}

module.exports = {
  getUserByEmail,
  getUserById,
  getUserByIdPersona,
  createUser,
  updateUserPassword,
  activateUser,
  createSesion,
  getAvaiableTokensByUser,
  generateToken,
  getPermissionsByAnySource,
  markTokensAsUsed,
  revokeAvailableTokens,
  isSuperUser,
};
