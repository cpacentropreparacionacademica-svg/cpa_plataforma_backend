/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { loadProjectEnv } = require('./official-user-utils');

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

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      id bigserial PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      checksum text NOT NULL,
      executed_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

function simpleChecksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function hasMigration(client, filename) {
  const result = await client.query(
    `SELECT checksum FROM public.schema_migrations WHERE filename = $1 LIMIT 1`,
    [filename],
  );
  return result.rows[0] || null;
}

function shouldRunFreshReset() {
  return process.argv.includes('--fresh')
    || process.env.MIGRATION_FRESH_RESET === 'true'
    || process.env.DB_RESET_BEFORE_MIGRATE === 'true';
}

async function runFreshReset(client, rootDir) {
  const resetFile = path.join(rootDir, 'docs', 'db', 'reset', '000_drop_existing_tables_if_exists.sql');

  if (!fs.existsSync(resetFile)) {
    throw new Error(`No existe el archivo de reset destructivo: ${resetFile}`);
  }

  const sql = fs.readFileSync(resetFile, 'utf8');

  console.warn('');
  console.warn('ADVERTENCIA: se ejecutará reset destructivo de schemas/tablas CPA.');
  console.warn('Esto eliminará datos existentes en los schemas funcionales antes de recrearlos.');
  console.warn('');

  await client.query('BEGIN');
  await client.query(sql);
  await client.query('TRUNCATE TABLE public.schema_migrations RESTART IDENTITY');
  await client.query('COMMIT');

  console.log('RESET destructivo ejecutado correctamente.');
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  loadProjectEnv(rootDir);

  const migrationsDir = path.join(rootDir, 'docs', 'db', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No hay migraciones SQL para ejecutar.');
    return;
  }

  const client = createPgClient();
  await client.connect();

  try {
    await ensureMigrationTable(client);

    if (shouldRunFreshReset()) {
      await runFreshReset(client, rootDir);
      await ensureMigrationTable(client);
    }

    for (const filename of files) {
      const filePath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      const checksum = simpleChecksum(sql);
      const previous = await hasMigration(client, filename);

      if (previous) {
        if (previous.checksum !== checksum) {
          throw new Error(`La migración ${filename} ya fue aplicada, pero el checksum cambió. No se ejecuta para evitar inconsistencias.`);
        }
        console.log(`SKIP ${filename}`);
        continue;
      }

      console.log(`RUN  ${filename}`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO public.schema_migrations (filename, checksum) VALUES ($1, $2)`,
        [filename, checksum],
      );
      await client.query('COMMIT');
      console.log(`OK   ${filename}`);
    }

    console.log('Migraciones de producción finalizadas correctamente.');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_rollbackError) {
      // ignorar rollback fuera de transacción activa
    }
    console.error('No se pudieron ejecutar las migraciones de producción.');
    console.error(error.message || error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
