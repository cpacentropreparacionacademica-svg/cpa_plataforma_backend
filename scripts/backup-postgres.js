#!/usr/bin/env node
/*
 * Backup lógico PostgreSQL para Render Cron Job.
 *
 * Modos soportados:
 * 1) Generar archivo .sql.gz local con pg_dump.
 * 2) Subir el archivo a BACKUP_UPLOAD_URL por multipart/form-data.
 * 3) Restaurar/replicar el dump hacia otra base PostgreSQL/Neon con BACKUP_TARGET_DATABASE_URL.
 *
 * Variables origen:
 * - DATABASE_URL o PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE
 *
 * Variables destino HTTP opcional:
 * - BACKUP_UPLOAD_URL=https://otro-host.com/api/backups/cpa
 * - BACKUP_UPLOAD_TOKEN=token-opcional
 *
 * Variables destino Neon/PostgreSQL opcional:
 * - BACKUP_TARGET_DATABASE_URL=postgresql://...
 * - BACKUP_RESTORE_TO_TARGET=true
 * - BACKUP_TARGET_CLEAN=true              // mantiene el dump con --clean --if-exists
 * - BACKUP_TARGET_CONFIRM=I_UNDERSTAND_TARGET_WILL_BE_REPLACED
 *
 * Nota: para backup hacia otra DB se requiere psql además de pg_dump.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { spawn, spawnSync } = require('child_process');

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sourceConnectionArgs() {
  if (process.env.DATABASE_URL) return [process.env.DATABASE_URL];

  const missing = ['PGHOST', 'PGUSER', 'PGDATABASE'].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Falta DATABASE_URL o variables PG*. Faltantes mínimas: ${missing.join(', ')}`);
  }

  const args = [
    '-h', process.env.PGHOST,
    '-U', process.env.PGUSER,
    '-d', process.env.PGDATABASE,
  ];
  if (process.env.PGPORT) args.splice(2, 0, '-p', process.env.PGPORT);
  return args;
}

function assertBinaryAvailable(binaryName, envVarName) {
  const bin = process.env[envVarName] || binaryName;
  const check = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  if (check.error || check.status !== 0) {
    throw new Error(
      `No se encontró ${binaryName} (${bin}). En Render usa Docker con postgresql-client instalado `
      + `o define ${envVarName} con la ruta correcta. Error: ${check.error?.message || check.stderr || 'desconocido'}`,
    );
  }
  console.log(`Usando ${String(check.stdout || check.stderr).trim()}`);
  return bin;
}

function dumpSchemaArgs() {
  const schemas = (process.env.BACKUP_SCHEMAS || 'administracion,contabilidad,deuda,infraestructura,inventario,persona,seguridad,servicios_educativos,societario,public')
    .split(',')
    .map((schema) => schema.trim())
    .filter(Boolean);
  return schemas.flatMap((schema) => ['--schema', schema]);
}

async function runPgDumpToGzip(outputPath) {
  const pgDumpBin = assertBinaryAvailable('pg_dump', 'PG_DUMP_BIN');

  const args = [
    ...sourceConnectionArgs(),
    '--no-owner',
    '--no-privileges',
    '--clean',
    '--if-exists',
    ...dumpSchemaArgs(),
  ];

  console.log(`Generando backup en ${outputPath}`);
  const dump = spawn(pgDumpBin, args, {
    env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const gzip = zlib.createGzip({ level: 9 });
  const file = fs.createWriteStream(outputPath);
  dump.stdout.pipe(gzip).pipe(file);

  let stderr = '';
  dump.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  await Promise.all([
    new Promise((resolve, reject) => file.on('finish', resolve).on('error', reject)),
    new Promise((resolve, reject) => {
      dump.on('error', reject);
      dump.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`pg_dump falló con código ${code}: ${stderr}`));
      });
    }),
  ]);
}

async function uploadBackup(filePath) {
  const uploadUrl = process.env.BACKUP_UPLOAD_URL;
  if (!uploadUrl) {
    console.log('BACKUP_UPLOAD_URL no definido. Se omite subida HTTP.');
    return null;
  }

  if (typeof fetch !== 'function' || typeof FormData !== 'function' || typeof Blob !== 'function') {
    throw new Error('Esta versión de Node no soporta fetch/FormData/Blob. Usa Node 20+ en Render.');
  }

  const filename = path.basename(filePath);
  const bytes = await fs.promises.readFile(filePath);
  const form = new FormData();
  form.append(process.env.BACKUP_UPLOAD_FIELD || 'file', new Blob([bytes], { type: 'application/gzip' }), filename);
  form.append('filename', filename);
  form.append('source', process.env.BACKUP_SOURCE_NAME || 'cpa-plataforma-backend');
  form.append('created_at', new Date().toISOString());

  const headers = {};
  if (process.env.BACKUP_UPLOAD_TOKEN) headers.Authorization = `Bearer ${process.env.BACKUP_UPLOAD_TOKEN}`;
  if (process.env.BACKUP_UPLOAD_HEADERS_JSON) Object.assign(headers, JSON.parse(process.env.BACKUP_UPLOAD_HEADERS_JSON));

  console.log(`Subiendo backup a ${uploadUrl}`);
  const response = await fetch(uploadUrl, {
    method: process.env.BACKUP_UPLOAD_METHOD || 'POST',
    headers,
    body: form,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Upload de backup falló con ${response.status}: ${text.slice(0, 1000)}`);
  }
  console.log(`Backup subido correctamente. Respuesta ${response.status}: ${text.slice(0, 500)}`);
  return { status: response.status, body: text };
}

async function restoreBackupToTargetDatabase(filePath) {
  const targetUrl = process.env.BACKUP_TARGET_DATABASE_URL;
  const shouldRestore = process.env.BACKUP_RESTORE_TO_TARGET === 'true' || Boolean(targetUrl);
  if (!shouldRestore) {
    console.log('BACKUP_TARGET_DATABASE_URL no definido. Se omite restauración a DB destino.');
    return null;
  }
  if (!targetUrl) throw new Error('BACKUP_RESTORE_TO_TARGET=true requiere BACKUP_TARGET_DATABASE_URL.');

  if (process.env.BACKUP_TARGET_CONFIRM !== 'I_UNDERSTAND_TARGET_WILL_BE_REPLACED') {
    throw new Error(
      'Por seguridad, define BACKUP_TARGET_CONFIRM=I_UNDERSTAND_TARGET_WILL_BE_REPLACED para permitir restaurar sobre la DB destino.',
    );
  }

  const psqlBin = assertBinaryAvailable('psql', 'PSQL_BIN');
  console.log('Restaurando backup hacia BACKUP_TARGET_DATABASE_URL. No se imprimen credenciales.');

  const gunzip = zlib.createGunzip();
  const read = fs.createReadStream(filePath);
  const psql = spawn(psqlBin, [targetUrl, '-v', 'ON_ERROR_STOP=1'], {
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  read.pipe(gunzip).pipe(psql.stdin);

  let stdout = '';
  let stderr = '';
  psql.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  psql.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  await new Promise((resolve, reject) => {
    psql.on('error', reject);
    psql.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`psql restore falló con código ${code}: ${stderr || stdout}`));
    });
  });

  console.log('Restauración a base destino completada correctamente.');
  return { restored: true };
}

async function main() {
  const localDir = process.env.BACKUP_LOCAL_DIR || path.join(os.tmpdir(), 'cpa-backups');
  await fs.promises.mkdir(localDir, { recursive: true });

  const filename = `${process.env.BACKUP_PREFIX || 'cpa-postgres'}-${nowStamp()}.sql.gz`;
  const outputPath = path.join(localDir, filename);
  await runPgDumpToGzip(outputPath);

  const stat = await fs.promises.stat(outputPath);
  if (stat.size <= 0) throw new Error('El backup generado está vacío.');
  console.log(`Backup generado: ${outputPath} (${stat.size} bytes)`);

  await uploadBackup(outputPath);
  await restoreBackupToTargetDatabase(outputPath);

  if (process.env.BACKUP_DELETE_LOCAL_AFTER_UPLOAD === 'true' && (process.env.BACKUP_UPLOAD_URL || process.env.BACKUP_TARGET_DATABASE_URL)) {
    await fs.promises.unlink(outputPath);
    console.log('Archivo local temporal eliminado después de subir/restaurar.');
  }
}

main().catch((error) => {
  console.error('BACKUP FAILED:', error?.stack || error?.message || error);
  process.exit(1);
});
