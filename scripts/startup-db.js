/* eslint-disable no-console */
/**
 * Preparación de base de datos en el arranque del servidor.
 *
 * Ejecuta, en este orden:
 *   1. Las migraciones pendientes (`scripts/migrate-prod.js`), protegidas por
 *      checksum y advisory lock, de modo que sólo corre lo que falta.
 *   2. Los seeds declarados en IDEMPOTENT_SEEDS, que se re-ejecutan SIEMPRE.
 *
 * El segundo paso existe porque un seed de catálogo no es un cambio de esquema:
 * debe converger en cada arranque. Si mañana se agregan más colegios o se
 * corrige un producto en el archivo de seed, un reinicio basta para que la base
 * quede al día, sin depender de que la migración no haya sido aplicada todavía.
 * Todos los archivos listados deben ser idempotentes: correrlos N veces tiene
 * que dar exactamente el mismo resultado que correrlos una vez.
 *
 * Interruptores:
 *   MIGRATE_ON_START=false  omite las migraciones.
 *   SEED_ON_START=false     omite los seeds idempotentes.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Client } = require('pg');
const { loadProjectEnv } = require('./official-user-utils');

const SEED_LOCK_KEY = 187294662;

/**
 * Seeds idempotentes que se aplican en cada arranque.
 * Son los mismos archivos registrados como migración, para no duplicar la
 * fuente de verdad: la migración los aplica en bases nuevas y este paso los
 * reconcilia en bases ya migradas.
 */
const IDEMPOTENT_SEEDS = [
  path.join('docs', 'db', 'migrations', '019_seed_catalogos_academicos_scz_correcciones.sql'),
];

function isDisabled(name) {
  return String(process.env[name] || '').trim().toLowerCase() === 'false';
}

function requireEnvironment(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} es obligatorio para preparar la base de datos.`);
  return value;
}

function createPgClient() {
  const sslRequired = process.env.PGSSLMODE === 'require';
  const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false';

  return new Client({
    host: requireEnvironment('PGHOST'),
    port: Number(process.env.PGPORT || 5432),
    database: requireEnvironment('PGDATABASE'),
    user: requireEnvironment('PGUSER'),
    password: requireEnvironment('PGPASSWORD'),
    ssl: sslRequired ? { rejectUnauthorized } : false,
    connectionTimeoutMillis: Number(process.env.DB_POOL_ACQUIRE_MS || 10000),
    statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 60000),
    application_name: 'cpa-startup-db',
  });
}

function runMigrations(rootDirectory) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(rootDirectory, 'scripts', 'migrate-prod.js')], {
      stdio: 'inherit',
      env: process.env,
      cwd: rootDirectory,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`Las migraciones terminaron con código ${code}.`));
    });
  });
}

async function runIdempotentSeeds(rootDirectory) {
  const files = IDEMPOTENT_SEEDS
    .map((relative) => ({ relative, absolute: path.join(rootDirectory, relative) }))
    .filter((file) => {
      if (fs.existsSync(file.absolute)) return true;
      console.warn(`AVISO seed no encontrado, se omite: ${file.relative}`);
      return false;
    });

  if (!files.length) return;

  const client = createPgClient();
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [SEED_LOCK_KEY]);
    for (const file of files) {
      console.log(`SEED ${file.relative}`);
      await client.query('BEGIN');
      try {
        await client.query(fs.readFileSync(file.absolute, 'utf8'));
        await client.query('COMMIT');
        console.log(`OK   ${file.relative}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [SEED_LOCK_KEY]).catch(() => undefined);
    await client.end();
  }
}

async function prepareDatabase(rootDirectory = path.resolve(__dirname, '..')) {
  loadProjectEnv(rootDirectory);

  if (isDisabled('MIGRATE_ON_START')) {
    console.log('MIGRATE_ON_START=false: se omiten las migraciones de arranque.');
  } else {
    await runMigrations(rootDirectory);
  }

  if (isDisabled('SEED_ON_START')) {
    console.log('SEED_ON_START=false: se omiten los seeds idempotentes de arranque.');
  } else {
    await runIdempotentSeeds(rootDirectory);
  }
}

module.exports = { prepareDatabase, IDEMPOTENT_SEEDS };

if (require.main === module) {
  prepareDatabase()
    .then(() => console.log('Base de datos lista.'))
    .catch((error) => {
      console.error('No se pudo preparar la base de datos en el arranque.');
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
