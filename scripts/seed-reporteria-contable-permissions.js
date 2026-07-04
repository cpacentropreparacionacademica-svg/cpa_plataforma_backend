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

  const migrationPath = path.join(rootDir, 'docs', 'db', 'migrations', '013_seed_reporteria_contable_permisos.sql');
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`No existe la migración de permisos de reportería: ${migrationPath}`);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const client = createPgClient();

  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
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
