#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Diagnóstico de migraciones: compara el checksum aplicado en la base con el
 * del archivo actual y con los checksums históricos aceptados.
 *
 * Existe porque el runner (`scripts/migrate-prod.js`) aborta el arranque cuando
 * una migración ya aplicada cambió de contenido, y ese mensaje por sí solo no
 * dice qué versión quedó registrada. Sin este dato no se puede decidir si la
 * diferencia es una corrección inerte —que corresponde declarar en
 * `docs/db/migrations-legacy-checksums.json`— o un cambio real de esquema, que
 * exige una migración nueva.
 *
 *   node scripts/list-migration-checksums.js
 *
 * Solo lee: no aplica nada ni modifica la base.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { loadProjectEnv } = require('./official-user-utils');

function requireEnvironment(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} es obligatorio para consultar el estado de migraciones.`);
  return value;
}

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function loadLegacyChecksums(rootDirectory) {
  const legacyPath = path.join(rootDirectory, 'docs', 'db', 'migrations-legacy-checksums.json');
  if (!fs.existsSync(legacyPath)) return new Map();
  const parsed = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  return new Map(
    Object.entries(parsed)
      .filter(([filename]) => !filename.startsWith('_'))
      .map(([filename, records]) => [
        filename,
        new Set((Array.isArray(records) ? records : []).map((record) => record.checksum)),
      ]),
  );
}

async function main() {
  const rootDirectory = path.resolve(__dirname, '..');
  loadProjectEnv(rootDirectory);

  const migrationsDirectory = path.join(rootDirectory, 'docs', 'db', 'migrations');
  const filenames = fs.readdirSync(migrationsDirectory).filter((file) => file.endsWith('.sql')).sort();
  const legacyChecksums = loadLegacyChecksums(rootDirectory);

  const client = new Client({
    host: requireEnvironment('PGHOST'),
    port: Number(process.env.PGPORT || 5432),
    database: requireEnvironment('PGDATABASE'),
    user: requireEnvironment('PGUSER'),
    password: requireEnvironment('PGPASSWORD'),
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' } : false,
    application_name: 'cpa-migration-doctor',
  });

  await client.connect();
  try {
    const applied = new Map();
    const result = await client.query(
      'SELECT filename, checksum, executed_at FROM infraestructura.schema_migrations ORDER BY filename',
    );
    for (const row of result.rows) applied.set(row.filename, row);

    let drift = 0;
    for (const filename of filenames) {
      const fileChecksum = checksum(fs.readFileSync(path.join(migrationsDirectory, filename), 'utf8'));
      const record = applied.get(filename);

      if (!record) {
        console.log(`PENDIENTE  ${filename}  archivo=${fileChecksum}`);
        continue;
      }

      if (record.checksum === fileChecksum) {
        console.log(`OK         ${filename}`);
        continue;
      }

      drift += 1;
      const declared = legacyChecksums.get(filename)?.has(record.checksum) ? 'declarado como histórico' : 'NO DECLARADO';
      console.log(`DIVERGE    ${filename}  (${declared})`);
      console.log(`             aplicado = ${record.checksum}  (${new Date(record.executed_at).toISOString()})`);
      console.log(`             archivo  = ${fileChecksum}`);
    }

    for (const filename of applied.keys()) {
      if (!filenames.includes(filename)) console.log(`HUÉRFANA   ${filename} (aplicada, ya no existe el archivo)`);
    }

    console.log(drift === 0 ? '\nSin divergencias de checksum.' : `\n${drift} migración(es) con checksum divergente.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('No se pudo leer el estado de migraciones.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
