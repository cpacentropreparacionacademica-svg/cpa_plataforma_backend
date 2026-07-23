/* eslint-disable no-console */
const crypto = require('crypto');
const { Client } = require('pg');

/**
 * Utilidades de seguridad compartidas por los scripts de sembrado y limpieza.
 *
 * Antes cada script traía su propia copia: hashing SHA-256 sin sal, TLS sin verificar,
 * credenciales por defecto en el repositorio y ninguna guarda de entorno. Al estar
 * duplicada la lógica, los mismos defectos existían por partida doble.
 */

const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 64;

/**
 * Produce un hash con el mismo formato versionado que `PasswordHasherService`.
 *
 * El runtime ya verificaba scrypt salado, pero los scripts de sembrado seguían
 * escribiendo SHA-256 plano: cada usuario sembrado nacía con un hash heredado que solo
 * se corregía si esa cuenta llegaba a iniciar sesión.
 *
 * Formato: scrypt$N$r$p$keyLength$salt$clave  (salt y clave en base64url)
 */
function hashPassword(password) {
  const value = String(password);
  const salt = crypto.randomBytes(16);
  const minimumMemory = 128 * SCRYPT_COST * SCRYPT_BLOCK_SIZE;
  const derivedKey = crypto.scryptSync(value, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: Math.max(64 * 1024 * 1024, minimumMemory + 32 * 1024 * 1024),
  });

  return [
    'scrypt',
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    SCRYPT_KEY_LENGTH,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

function isProduction() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

/**
 * Bloquea por completo una operación en producción.
 * Se usa en los datos de demostración, que nunca deben existir en un entorno real.
 */
function assertNotProduction(operation) {
  if (isProduction()) {
    throw new Error(
      `${operation} está prohibido con NODE_ENV=production. Los datos de demostración no deben existir en un entorno productivo.`,
    );
  }
}

/**
 * Exige confirmación explícita para operaciones destructivas.
 *
 * Antes bastaba con ejecutar el script: no había ninguna barrera entre un comando de
 * limpieza y el borrado de cuentas administrativas con su rastro de auditoría.
 */
function assertDestructiveOperationAllowed(operation) {
  if (isProduction() && process.env.ALLOW_DESTRUCTIVE_SEED_CLEANUP !== 'true') {
    throw new Error(
      `${operation} es destructivo y está bloqueado en producción. ` +
        'Si realmente debe ejecutarse, exige ALLOW_DESTRUCTIVE_SEED_CLEANUP=true y una copia de seguridad previa.',
    );
  }
}

/**
 * Exige que la contraseña llegue por entorno.
 *
 * El valor por defecto anterior estaba escrito en el repositorio, de modo que cualquier
 * ejecución sin variables creaba un superusuario con una credencial pública.
 */
function requireSeedPassword(variableNames) {
  for (const name of variableNames) {
    const value = process.env[name];
    if (value !== undefined && String(value).trim() !== '') return String(value).trim();
  }

  throw new Error(
    `Debes definir ${variableNames[0]} para sembrar el usuario. ` +
      'No existe contraseña por defecto: una credencial en el repositorio es una credencial pública.',
  );
}

/**
 * Cliente PostgreSQL con verificación de certificado.
 *
 * `rejectUnauthorized: false` desactivaba la validación del certificado, dejando la
 * conexión expuesta a intercepción pese a usar TLS.
 */
function createSecurePgClient(applicationName = 'cpa-seed') {
  const sslRequired = process.env.PGSSLMODE === 'require';
  const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false';

  if (isProduction() && sslRequired && !rejectUnauthorized) {
    throw new Error('PGSSL_REJECT_UNAUTHORIZED=false no está permitido en producción.');
  }

  return new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'cpa_platform',
    user: process.env.PGUSER || 'cpa_backend',
    password: process.env.PGPASSWORD,
    ssl: sslRequired ? { rejectUnauthorized } : false,
    application_name: applicationName,
  });
}

module.exports = {
  hashPassword,
  isProduction,
  assertNotProduction,
  assertDestructiveOperationAllowed,
  requireSeedPassword,
  createSecurePgClient,
};
