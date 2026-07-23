/* eslint-disable no-console */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { loadProjectEnv } = require('./official-user-utils');

const MIGRATION_LOCK_KEY = 187294661;

function requireEnvironment(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} es obligatorio para ejecutar migraciones.`);
  return value;
}

function createPgClient() {
  const database = requireEnvironment('PGDATABASE');
  if (database.toLowerCase() === 'postgres') {
    throw new Error('Las migraciones funcionales no pueden ejecutarse sobre la base administrativa postgres.');
  }

  const sslRequired = process.env.PGSSLMODE === 'require';
  const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false';
  if (process.env.NODE_ENV === 'production' && sslRequired && !rejectUnauthorized) {
    throw new Error('PGSSL_REJECT_UNAUTHORIZED=false no está permitido para migraciones de producción.');
  }

  return new Client({
    host: requireEnvironment('PGHOST'),
    port: Number(process.env.PGPORT || 5432),
    database,
    user: requireEnvironment('PGUSER'),
    password: requireEnvironment('PGPASSWORD'),
    ssl: sslRequired ? { rejectUnauthorized } : false,
    connectionTimeoutMillis: Number(process.env.DB_POOL_ACQUIRE_MS || 10000),
    statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 60000),
    application_name: 'cpa-schema-migrator',
  });
}

async function ensureMigrationTable(client) {
  await client.query('CREATE SCHEMA IF NOT EXISTS infraestructura');
  await client.query(`
    CREATE TABLE IF NOT EXISTS infraestructura.schema_migrations (
      id bigserial PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      checksum text NOT NULL,
      executed_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const legacyTable = await client.query("SELECT to_regclass('public.schema_migrations') AS table_name");
  if (legacyTable.rows[0]?.table_name) {
    await client.query(`
      INSERT INTO infraestructura.schema_migrations (filename, checksum, executed_at)
      SELECT filename, checksum, executed_at FROM public.schema_migrations
      ON CONFLICT (filename) DO NOTHING
    `);
  }
}

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Checksums históricos aceptados para migraciones ya aplicadas.
 * Permite corregir una migración defectuosa de forma idempotente sin bloquear
 * despliegues existentes, manteniendo la detección de cambios no declarados.
 */
function loadLegacyChecksums(rootDirectory) {
  const legacyPath = path.join(rootDirectory, 'docs', 'db', 'migrations-legacy-checksums.json');
  if (!fs.existsSync(legacyPath)) return new Map();

  const parsed = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  const entries = Object.entries(parsed).filter(([filename]) => !filename.startsWith('_'));
  return new Map(entries.map(([filename, records]) => [
    filename,
    new Set((Array.isArray(records) ? records : []).map((record) => record.checksum)),
  ]));
}

async function findAppliedMigration(client, filename) {
  const result = await client.query(
    'SELECT checksum FROM infraestructura.schema_migrations WHERE filename = $1 LIMIT 1',
    [filename],
  );
  return result.rows[0] || null;
}

function destructiveResetRequested() {
  const requested = process.env.MIGRATION_FRESH_RESET === 'true' || process.env.DB_RESET_BEFORE_MIGRATE === 'true';
  if (!requested) return false;
  if (process.env.NODE_ENV === 'production') throw new Error('El reset destructivo está prohibido en producción.');
  if (process.env.ALLOW_DESTRUCTIVE_DB_RESET !== 'true') {
    throw new Error('El reset requiere ALLOW_DESTRUCTIVE_DB_RESET=true en un entorno no productivo.');
  }
  return true;
}

async function runFreshReset(client, rootDirectory) {
  const resetFile = path.join(rootDirectory, 'docs', 'db', 'reset', '000_drop_existing_tables_if_exists.sql');
  if (!fs.existsSync(resetFile)) throw new Error(`No existe el archivo de reset destructivo: ${resetFile}`);
  await client.query('BEGIN');
  try {
    await client.query(fs.readFileSync(resetFile, 'utf8'));
    await client.query('TRUNCATE TABLE infraestructura.schema_migrations RESTART IDENTITY');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function runMigration(client, migrationsDirectory, filename, legacyChecksums) {
  const sql = fs.readFileSync(path.join(migrationsDirectory, filename), 'utf8');
  const fileChecksum = checksum(sql);
  const applied = await findAppliedMigration(client, filename);
  if (applied) {
    if (applied.checksum !== fileChecksum) {
      if (!legacyChecksums.get(filename)?.has(applied.checksum)) {
        throw new Error(`La migración ${filename} cambió después de aplicarse.`);
      }
      console.log(`SKIP ${filename} (checksum histórico aceptado; corrección idempotente declarada)`);
      await client.query(
        'UPDATE infraestructura.schema_migrations SET checksum = $1 WHERE filename = $2',
        [fileChecksum, filename],
      );
      return;
    }
    console.log(`SKIP ${filename}`);
    return;
  }

  console.log(`RUN  ${filename}`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO infraestructura.schema_migrations (filename, checksum) VALUES ($1, $2)',
      [filename, fileChecksum],
    );
    await client.query('COMMIT');
    console.log(`OK   ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const rootDirectory = path.resolve(__dirname, '..');
  loadProjectEnv(rootDirectory);
  const migrationsDirectory = path.join(rootDirectory, 'docs', 'db', 'migrations');
  const filenames = fs.readdirSync(migrationsDirectory).filter((file) => file.endsWith('.sql')).sort();
  if (!filenames.length) return console.log('No hay migraciones SQL para ejecutar.');

  const client = createPgClient();
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY]);
    await ensureMigrationTable(client);
    if (destructiveResetRequested()) {
      await runFreshReset(client, rootDirectory);
      await ensureMigrationTable(client);
    }
    const legacyChecksums = loadLegacyChecksums(rootDirectory);
    for (const filename of filenames) await runMigration(client, migrationsDirectory, filename, legacyChecksums);
    console.log('Migraciones de producción finalizadas correctamente.');
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]).catch(() => undefined);
    await client.end();
  }
}

main().catch((error) => {
  console.error('No se pudieron ejecutar las migraciones de producción.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
