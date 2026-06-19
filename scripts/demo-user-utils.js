/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');

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

function loadProjectEnv(rootDir = path.resolve(__dirname, '..')) {
  loadEnvFile(path.join(rootDir, '.env.test'));
  loadEnvFile(path.join(rootDir, '.env'));
  loadEnvFile(path.join(rootDir, '.env.example'));
}

function firstEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && String(value).trim() !== '') return String(value).trim();
  }
  return undefined;
}

function getTestUserFromEnv() {
  const email = firstEnv('TEST_USER_EMAIL', 'Email', 'EMAIL') || 'admin.demo@cpa.test';
  const username = firstEnv('TEST_USER_USERNAME', 'Usuario', 'USUARIO', 'USERNAME') || 'admin.demo';
  const password = firstEnv('TEST_USER_PASSWORD', 'Password', 'PASSWORD') || 'DemoAdmin123!';
  const idPersona = Number(firstEnv('TEST_USER_ID', 'IdPersona', 'ID_PERSONA') || 900001);
  const firstName = firstEnv('TEST_USER_FIRST_NAME', 'Nombres') || 'Admin';
  const lastName = firstEnv('TEST_USER_LAST_NAME', 'Apellidos') || 'Demo';
  const phone = firstEnv('TEST_USER_PHONE', 'Telefono') || '70000000';
  const userType = firstEnv('TEST_USER_TYPE', 'TipoUsuario') || 'ADMIN_DEMO';

  if (!Number.isInteger(idPersona) || idPersona <= 0) {
    throw new Error('TEST_USER_ID debe ser un entero positivo.');
  }

  return { idPersona, email, username, password, firstName, lastName, phone, userType };
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function createPgClient() {
  return new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'neondb',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  });
}

async function cleanDemoData(client, testUser = getTestUserFromEnv()) {
  const cleanIdFrom = Number(firstEnv('TEST_USER_CLEAN_ID_FROM') || 900001);
  const cleanIdTo = Number(firstEnv('TEST_USER_CLEAN_ID_TO') || 900099);
  const emailDomain = testUser.email.includes('@') ? `%@${testUser.email.split('@').pop().toLowerCase()}` : '%@cpa.test';
  const demoUsernames = [testUser.username, 'admin.demo', 'demo', 'test', 'usuario.demo'];
  const demoTypes = [testUser.userType, 'ADMIN_DEMO', 'DEMO', 'TEST'];

  await client.query(`DROP TABLE IF EXISTS pg_temp.tmp_demo_personas`);
  await client.query(`CREATE TEMP TABLE tmp_demo_personas (id_persona bigint PRIMARY KEY) ON COMMIT DROP`);

  await client.query(
    `INSERT INTO tmp_demo_personas (id_persona)
     SELECT DISTINCT id_persona
     FROM (
       SELECT p.id_persona
       FROM persona.persona p
       WHERE p.id_persona BETWEEN $1 AND $2
          OR LOWER(COALESCE(p.email, '')) = LOWER($3)
          OR LOWER(COALESCE(p.email, '')) LIKE LOWER($4)
       UNION
       SELECT u.id_persona
       FROM persona.persona_usuario u
       WHERE u.id_persona BETWEEN $1 AND $2
          OR LOWER(u.nombre_usuario) = ANY($5::text[])
          OR UPPER(COALESCE(u.tipo_usuario, '')) = ANY($6::text[])
     ) demo_scope
     ON CONFLICT (id_persona) DO NOTHING`,
    [
      cleanIdFrom,
      cleanIdTo,
      testUser.email,
      emailDomain,
      demoUsernames.map((value) => value.toLowerCase()),
      demoTypes.map((value) => value.toUpperCase()),
    ],
  );

  await client.query(
    `DELETE FROM seguridad.action_log al
     USING seguridad.sesion s, tmp_demo_personas d
     WHERE al.id_sesion = s.id_sesion
       AND s.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM seguridad.sesion s
     USING tmp_demo_personas d
     WHERE s.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM seguridad.usuario_token_accion uta
     USING tmp_demo_personas d
     WHERE uta.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM seguridad.usuario_permiso up
     USING tmp_demo_personas d
     WHERE up.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM seguridad.usuario_rol ur
     USING tmp_demo_personas d
     WHERE ur.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM persona.persona_usuario u
     USING tmp_demo_personas d
     WHERE u.id_persona = d.id_persona`,
  );

  await client.query(
    `DELETE FROM persona.persona p
     USING tmp_demo_personas d
     WHERE p.id_persona = d.id_persona
       AND NOT EXISTS (SELECT 1 FROM administracion.empleado e WHERE e.id_persona = p.id_persona)
       AND NOT EXISTS (SELECT 1 FROM contabilidad.transaccion t WHERE t.id_cliente = p.id_persona)
       AND NOT EXISTS (SELECT 1 FROM infraestructura.tienda ti WHERE ti.id_responsable = p.id_persona)
       AND NOT EXISTS (SELECT 1 FROM societario.titular st WHERE st.id_persona = p.id_persona)`,
  );

  const countRows = await client.query(`SELECT COUNT(*)::int AS count FROM tmp_demo_personas`);
  return countRows.rows[0]?.count || 0;
}

async function seedDemoUser(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  loadProjectEnv(rootDir);

  const testUser = getTestUserFromEnv();
  const client = createPgClient();

  await client.connect();
  try {
    await client.query('BEGIN');
    const cleaned = await cleanDemoData(client, testUser);

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
      [testUser.idPersona, testUser.username, sha256(testUser.password), testUser.userType],
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

async function runCleanDemoData(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  loadProjectEnv(rootDir);

  const testUser = getTestUserFromEnv();
  const client = createPgClient();
  await client.connect();
  try {
    await client.query('BEGIN');
    const cleaned = await cleanDemoData(client, testUser);
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
  getTestUserFromEnv,
  seedDemoUser,
  runCleanDemoData,
};
