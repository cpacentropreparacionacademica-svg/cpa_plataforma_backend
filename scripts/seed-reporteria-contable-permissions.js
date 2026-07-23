/* eslint-disable no-console */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { loadProjectEnv } = require('./official-user-utils');
const { createSecurePgClient } = require('./seed-security');

const MIGRATION_FILENAME = '013_seed_reporteria_contable_permisos.sql';

function createPgClient() {
  return createSecurePgClient('cpa-seed-reporteria');
}

/**
 * Registra la migración en el libro de migraciones.
 *
 * Este script ejecuta un archivo de `docs/db/migrations` directamente. Al no dejar
 * constancia en `infraestructura.schema_migrations`, `migrate-prod.js` volvía a
 * aplicarlo después. La migración 013 es idempotente, así que no causaba daño, pero el
 * libro de migraciones dejaba de reflejar el estado real de la base de datos.
 */
async function recordMigration(client, sql) {
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');
  await client.query('CREATE SCHEMA IF NOT EXISTS infraestructura');
  await client.query(`
    CREATE TABLE IF NOT EXISTS infraestructura.schema_migrations (
      id bigserial PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      checksum text NOT NULL,
      executed_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(
    `INSERT INTO infraestructura.schema_migrations (filename, checksum)
     VALUES ($1, $2)
     ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum`,
    [MIGRATION_FILENAME, checksum],
  );
}

async function countReporteriaPermissions(client) {
  const result = await client.query(
    `SELECT COUNT(*)::int AS total
       FROM seguridad.permiso
      WHERE codigo LIKE 'REPORTERIA.CONTABILIDAD.%'
         OR codigo LIKE 'REPORTERIA.CONTABLE.%'
         OR codigo IN (
           'CONTABILIDAD.REPORTERIA.READ',
           'CONTABILIDAD.REPORTES.READ',
           'CONTABILIDAD.LIBRO_DIARIO.READ',
           'CONTABILIDAD.LIBRO_MAYOR.READ',
           'CONTABILIDAD.EEFF.READ',
           'CONTABILIDAD.ESTADO_RESULTADOS.READ',
           'CONTABILIDAD.BALANCE_GENERAL.READ',
           'CONTABILIDAD.FLUJO_CAJA.READ'
         )`,
  );
  return result.rows[0]?.total || 0;
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  loadProjectEnv(rootDir);

  const migrationPath = path.join(rootDir, 'docs', 'db', 'migrations', MIGRATION_FILENAME);
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`No existe la migración de permisos de reportería: ${migrationPath}`);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const client = createPgClient();

  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await recordMigration(client, sql);
    await client.query('COMMIT');

    const total = await countReporteriaPermissions(client);
    console.log('Seed de permisos de reportería contable ejecutado correctamente.');
    console.log('Permisos de reportería contable activos detectados:', total);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_rollbackError) {
      // ignorar rollback fuera de transacción activa
    }
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('No se pudo ejecutar el seed de permisos de reportería contable.');
  console.error(error.message || error);
  process.exitCode = 1;
});
