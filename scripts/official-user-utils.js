/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const {
  assertDestructiveOperationAllowed,
  createSecurePgClient,
  hashPassword,
  requireSeedPassword,
} = require('./seed-security');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/**
 * Carga la configuración local del proyecto.
 *
 * `.env.example` queda deliberadamente fuera: es una plantilla con valores de relleno
 * (`replace-with-a-secret`), no configuración. Al cargarlo, cualquier ejecución sin
 * variables reales tomaba silenciosamente credenciales de ejemplo y las escribía en la
 * base de datos como si fueran válidas.
 */
function loadProjectEnv(rootDir = path.resolve(__dirname, '..')) {
  loadEnvFile(path.join(rootDir, '.env.test'));
  loadEnvFile(path.join(rootDir, '.env'));
}

function firstEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && String(value).trim() !== '') return String(value).trim();
  }
  return undefined;
}

/**
 * Lee la identidad del usuario oficial usando únicamente nombres con prefijo TEST_USER_.
 *
 * Los alias genéricos anteriores (`USERNAME`, `PASSWORD`, `EMAIL`, `Usuario`...) colisionan
 * con variables que el sistema operativo y los entornos de CI ya definen. En Windows,
 * `USERNAME` siempre existe y contiene la cuenta del sistema, de modo que el seed creaba
 * el usuario administrador con el nombre de la sesión de Windows en lugar del configurado.
 * Un `PASSWORD` heredado del entorno podía, del mismo modo, fijar la credencial sin que
 * nadie lo hubiera decidido.
 */
function getOfficialUserFromEnv({ requirePassword = true } = {}) {
  const email = firstEnv('TEST_USER_EMAIL') || 'pablo.admin@cpa.com';
  const username = firstEnv('TEST_USER_USERNAME') || 'pablo.admin';
  // Sin valor por defecto: la contraseña anterior estaba escrita en el repositorio.
  // La limpieza no necesita contraseña, solo identidad: exigirla allí ocultaría el
  // verdadero motivo por el que una operación destructiva se detiene.
  const password = requirePassword ? requireSeedPassword(['TEST_USER_PASSWORD']) : undefined;
  const idPersona = Number(firstEnv('TEST_USER_ID') || 900001);
  const firstName = firstEnv('TEST_USER_FIRST_NAME') || 'Pablo';
  const lastName = firstEnv('TEST_USER_LAST_NAME') || 'Arauz Caballero';
  const phone = firstEnv('TEST_USER_PHONE') || '70000000';
  const userType = firstEnv('TEST_USER_TYPE') || 'SUPER_ADMIN';

  if (!Number.isInteger(idPersona) || idPersona <= 0) {
    throw new Error('TEST_USER_ID debe ser un entero positivo.');
  }

  return { idPersona, email, username, password, firstName, lastName, phone, userType };
}

function createPgClient() {
  return createSecurePgClient('cpa-seed-official');
}

/**
 * Delimita el alcance de la limpieza a la cuenta sembrada, y solo a ella.
 *
 * La versión anterior incluía el predicado
 *   `UPPER(COALESCE(u.tipo_usuario, '')) = ANY(ARRAY['SUPER_ADMIN', ...])`
 * que no seleccionaba al usuario sembrado sino a **todos** los superadministradores del
 * sistema. Las sentencias siguientes borran sesiones, tokens, permisos, roles y cuentas
 * de todo lo que caiga en este ámbito, de modo que ejecutar la limpieza contra una base
 * real eliminaba todas las cuentas administrativas y su rastro de auditoría.
 *
 * El alcance correcto es la identidad concreta que el propio seed crea: su id, su correo
 * y su nombre de usuario. El rango TEST_USER_CLEAN_ID_FROM/TO, que se leía pero nunca se
 * usaba en ninguna consulta, ahora sí acota el ámbito tal y como afirmaba la documentación.
 */
async function cleanOfficialUserData(client, testUser = getOfficialUserFromEnv({ requirePassword: false })) {
  const cleanIdFrom = Number(firstEnv('TEST_USER_CLEAN_ID_FROM') || 900001);
  const cleanIdTo = Number(firstEnv('TEST_USER_CLEAN_ID_TO') || 900099);

  if (!Number.isInteger(cleanIdFrom) || !Number.isInteger(cleanIdTo) || cleanIdFrom > cleanIdTo) {
    throw new Error('TEST_USER_CLEAN_ID_FROM y TEST_USER_CLEAN_ID_TO deben ser enteros con FROM <= TO.');
  }

  await client.query(`DROP TABLE IF EXISTS pg_temp.tmp_seed_personas`);
  await client.query(`CREATE TEMP TABLE tmp_seed_personas (id_persona bigint PRIMARY KEY) ON COMMIT DROP`);

  await client.query(
    `INSERT INTO tmp_seed_personas (id_persona)
     SELECT DISTINCT id_persona
     FROM (
       SELECT p.id_persona
       FROM persona.persona p
       WHERE p.id_persona = $1
          OR (LOWER(COALESCE(p.email, '')) = LOWER($2) AND p.id_persona BETWEEN $4 AND $5)
       UNION
       SELECT u.id_persona
       FROM persona.persona_usuario u
       WHERE u.id_persona = $1
          OR (LOWER(u.nombre_usuario) = LOWER($3) AND u.id_persona BETWEEN $4 AND $5)
     ) seed_scope
     ON CONFLICT (id_persona) DO NOTHING`,
    [testUser.idPersona, testUser.email, testUser.username, cleanIdFrom, cleanIdTo],
  );

  // Red de seguridad: si el ámbito creciera por un cambio futuro, es preferible fallar
  // que borrar cuentas que el seed no creó.
  const scopeRows = await client.query(`SELECT COUNT(*)::int AS count FROM tmp_seed_personas`);
  const scopeSize = scopeRows.rows[0]?.count || 0;
  if (scopeSize > 1) {
    throw new Error(
      `La limpieza abarcaría ${scopeSize} personas y solo debe alcanzar a la cuenta sembrada. `
        + 'Se aborta para no eliminar cuentas ajenas al seed.',
    );
  }

  await client.query(
    `DELETE FROM seguridad.action_log al
     USING seguridad.sesion s, tmp_seed_personas d
     WHERE al.id_sesion = s.id_sesion
       AND s.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM seguridad.sesion s
     USING tmp_seed_personas d
     WHERE s.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM seguridad.usuario_token_accion uta
     USING tmp_seed_personas d
     WHERE uta.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM seguridad.usuario_permiso up
     USING tmp_seed_personas d
     WHERE up.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM seguridad.usuario_rol ur
     USING tmp_seed_personas d
     WHERE ur.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM persona.persona_usuario u
     USING tmp_seed_personas d
     WHERE u.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM persona.persona p
     USING tmp_seed_personas d
     WHERE p.id_persona = d.id_persona
       AND NOT EXISTS (SELECT 1 FROM persona.persona_estudiante pe WHERE pe.id_persona = p.id_persona)
       AND NOT EXISTS (SELECT 1 FROM persona.persona_tutor pt WHERE pt.id_persona = p.id_persona)
       AND NOT EXISTS (SELECT 1 FROM administracion.empleado e WHERE e.id_persona = p.id_persona)
       AND NOT EXISTS (SELECT 1 FROM contabilidad.transaccion t WHERE t.id_cliente = p.id_persona)
       AND NOT EXISTS (SELECT 1 FROM infraestructura.tienda ti WHERE ti.id_responsable = p.id_persona)
       AND NOT EXISTS (SELECT 1 FROM societario.titular st WHERE st.id_persona = p.id_persona)`,
  );

  const countRows = await client.query(`SELECT COUNT(*)::int AS count FROM tmp_seed_personas`);
  return countRows.rows[0]?.count || 0;
}

async function seedOfficialUser(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  loadProjectEnv(rootDir);

  const testUser = getOfficialUserFromEnv();
  const client = createPgClient();

  await client.connect();
  try {
    await client.query('BEGIN');
    const cleaned = await cleanOfficialUserData(client, testUser);

    await client.query(
      `INSERT INTO persona.persona (
         id_persona,
         nombres,
         apellidos,
         telefono,
         fecha_nacimiento,
         email,
         estado_registro,
         fecha_registro,
         fecha_modificacion,
         version_registro,
         id_usuario_creador,
         id_usuario_modificacion
       )
       VALUES ($1, $2, $3, $4, DATE '2000-01-01', $5, 'Activo', NOW(), NULL, 1, NULL, NULL)
       ON CONFLICT (id_persona) DO UPDATE SET
         nombres = EXCLUDED.nombres,
         apellidos = EXCLUDED.apellidos,
         telefono = EXCLUDED.telefono,
         fecha_nacimiento = EXCLUDED.fecha_nacimiento,
         email = EXCLUDED.email,
         estado_registro = 'Activo',
         fecha_modificacion = NOW(),
         version_registro = COALESCE(persona.persona.version_registro, 1) + 1`,
      [testUser.idPersona, testUser.firstName, testUser.lastName, testUser.phone, testUser.email],
    );

    await client.query(
      `INSERT INTO persona.persona_usuario (
         id_persona,
         nombre_usuario,
         contrasena_hash,
         tipo_usuario,
         estado_registro,
         fecha_registro,
         fecha_modificacion,
         version_registro,
         id_usuario_creador,
         id_usuario_modificacion,
         es_super_usuario
       )
       VALUES ($1, $2, $3, $4, 'Activo', NOW(), NULL, 1, NULL, NULL, true)
       ON CONFLICT (id_persona) DO UPDATE SET
         nombre_usuario = EXCLUDED.nombre_usuario,
         contrasena_hash = EXCLUDED.contrasena_hash,
         tipo_usuario = EXCLUDED.tipo_usuario,
         estado_registro = 'Activo',
         fecha_modificacion = NOW(),
         version_registro = COALESCE(persona.persona_usuario.version_registro, 1) + 1,
         es_super_usuario = true`,
      [testUser.idPersona, testUser.username, hashPassword(testUser.password), testUser.userType],
    );

    await client.query(
      `INSERT INTO seguridad.usuario_rol (
         id_persona,
         id_rol,
         fecha_registro,
         estado_registro,
         fecha_modificacion,
         version_registro,
         id_usuario_creador,
         id_usuario_modificacion
       )
       SELECT $1, r.id_rol, NOW(), 'Activo', NULL, 1, $1, NULL
       FROM seguridad.rol r
       WHERE r.codigo = 'ADMIN_GENERAL'
       ON CONFLICT (id_persona, id_rol) DO UPDATE SET
         estado_registro = 'Activo',
         fecha_modificacion = NOW(),
         version_registro = COALESCE(seguridad.usuario_rol.version_registro, 1) + 1`,
      [testUser.idPersona],
    );

    await client.query(
      `SELECT setval(
         'persona.persona_id_persona_seq',
         (SELECT GREATEST(COALESCE(MAX(id_persona), 1), $1) FROM persona.persona),
         true
       )`,
      [testUser.idPersona],
    );

    await client.query('COMMIT');
    return { cleaned, testUser: { ...testUser, password: undefined } };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function runCleanOfficialUserData(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  loadProjectEnv(rootDir);

  assertDestructiveOperationAllowed('La limpieza del usuario oficial');

  const testUser = getOfficialUserFromEnv({ requirePassword: false });
  const client = createPgClient();
  await client.connect();
  try {
    await client.query('BEGIN');
    const cleaned = await cleanOfficialUserData(client, testUser);
    await client.query('COMMIT');
    return { cleaned, testUser: { ...testUser, password: undefined } };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

module.exports = {
  loadEnvFile,
  loadProjectEnv,
  firstEnv,
  getOfficialUserFromEnv,
  seedOfficialUser,
  runCleanOfficialUserData,
};
