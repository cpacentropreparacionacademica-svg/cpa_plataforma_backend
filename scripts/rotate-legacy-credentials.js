/* eslint-disable no-console */
const { loadProjectEnv } = require('./official-user-utils');
const { createSecurePgClient, hashPassword } = require('./seed-security');

/**
 * Rota credenciales con hash heredado SHA-256 sin sal.
 *
 * Por qué existe: la migración 003 siembra usuarios base con hashes SHA-256 precomputados.
 * Al no llevar sal y estar el hash en el repositorio, la contraseña en claro es
 * recuperable, y uno de esos usuarios es superadministrador. El runtime actualiza el
 * hash al primer inicio de sesión correcto, pero eso no sirve de nada si quien lo usa
 * primero es un tercero: la credencial ya es pública.
 *
 * Este script NO se ejecuta solo ni forma parte de las migraciones, precisamente porque
 * invalidar credenciales administrativas puede dejar a un operador fuera de su propio
 * sistema. La rotación es una decisión deliberada del propietario.
 *
 * Uso:
 *   node scripts/rotate-legacy-credentials.js --list
 *   ROTATE_USERNAME=katia.admin ROTATE_PASSWORD='...' node scripts/rotate-legacy-credentials.js
 */

const LEGACY_HASH_PATTERN = "contrasena_hash ~ '^[a-f0-9]{64}$'";

async function listLegacyAccounts(client) {
  const result = await client.query(
    `SELECT id_persona, nombre_usuario, tipo_usuario, es_super_usuario, estado_registro
       FROM persona.persona_usuario
      WHERE ${LEGACY_HASH_PATTERN}
      ORDER BY es_super_usuario DESC, nombre_usuario ASC`,
  );
  return result.rows;
}

async function rotate(client, username, password) {
  if (String(password).length < 12) {
    throw new Error('ROTATE_PASSWORD debe tener al menos 12 caracteres.');
  }

  const result = await client.query(
    `UPDATE persona.persona_usuario
        SET contrasena_hash = $2,
            fecha_modificacion = now(),
            version_registro = COALESCE(version_registro, 1) + 1
      WHERE LOWER(nombre_usuario) = LOWER($1)
      RETURNING id_persona, nombre_usuario`,
    [username, hashPassword(password)],
  );

  if (result.rowCount === 0) {
    throw new Error(`No existe el usuario '${username}'.`);
  }

  return result.rows[0];
}

async function main() {
  loadProjectEnv();
  const client = createSecurePgClient('cpa-rotate-credentials');
  await client.connect();

  try {
    const legacyAccounts = await listLegacyAccounts(client);

    if (process.argv.includes('--list') || !process.env.ROTATE_USERNAME) {
      if (legacyAccounts.length === 0) {
        console.log('No hay cuentas con hash heredado SHA-256. Nada que rotar.');
        return;
      }

      console.log(`Cuentas con hash heredado SHA-256 sin sal: ${legacyAccounts.length}`);
      for (const account of legacyAccounts) {
        const marca = account.es_super_usuario ? ' [SUPERUSUARIO]' : '';
        console.log(`- ${account.nombre_usuario} (id ${account.id_persona}, ${account.tipo_usuario})${marca}`);
      }
      console.log('');
      console.log('Para rotar una credencial:');
      console.log(
        "  ROTATE_USERNAME=<usuario> ROTATE_PASSWORD='<contraseña nueva>' node scripts/rotate-legacy-credentials.js",
      );
      return;
    }

    const password = process.env.ROTATE_PASSWORD;
    if (!password) throw new Error('Debes definir ROTATE_PASSWORD para rotar la credencial.');

    const rotated = await rotate(client, process.env.ROTATE_USERNAME, password);
    console.log(`Credencial rotada correctamente para '${rotated.nombre_usuario}' (id ${rotated.id_persona}).`);
    console.log('El hash ahora usa scrypt con sal única. La contraseña no se muestra.');

    const restantes = await listLegacyAccounts(client);
    console.log(`Cuentas con hash heredado pendientes: ${restantes.length}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('No se pudo completar la rotación de credenciales.');
  console.error(error.message || error);
  process.exitCode = 1;
});
