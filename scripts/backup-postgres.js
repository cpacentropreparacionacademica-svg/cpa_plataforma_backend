#!/usr/bin/env node
/*
 * Backup lógico PostgreSQL para Render Cron Job.
 *
 * Modos soportados:
 * 1) Generar archivo .sql.gz local con pg_dump.
 * 2) Subir el archivo a BACKUP_UPLOAD_URL por multipart/form-data HTTP.
 * 3) Restaurar/replicar el dump hacia otra base PostgreSQL/Neon con BACKUP_TARGET_DATABASE_URL.
 *
 * Seguridad:
 * - No imprime credenciales.
 * - No restaura por accidente: requiere BACKUP_RESTORE_TO_TARGET=true.
 * - Para restaurar requiere BACKUP_TARGET_CONFIRM=I_UNDERSTAND_TARGET_WILL_BE_REPLACED.
 * - Rechaza BACKUP_UPLOAD_URL si por error se coloca una URL postgresql://.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { spawn, spawnSync } = require('child_process');
const { pipeline } = require('stream/promises');

const DEFAULT_SCHEMAS = 'administracion,contabilidad,deuda,infraestructura,inventario,persona,seguridad,servicios_educativos,societario,public';

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function isTrue(value) {
  return String(value || '').toLowerCase() === 'true';
}

function redactUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.username) url.username = '***';
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return '[url inválida o no imprimible]';
  }
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

function backupSchemas() {
  return (process.env.BACKUP_SCHEMAS || DEFAULT_SCHEMAS)
    .split(',')
    .map((schema) => schema.trim())
    .filter(Boolean);
}

function dumpSchemaArgs() {
  return backupSchemas().flatMap((schema) => ['--schema', schema]);
}

async function runProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...(options.env || {}) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} falló con código ${code}: ${(stderr || stdout).slice(0, 5000)}`));
    });
  });

  return { stdout, stderr };
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

  let stderr = '';
  dump.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  const dumpClosed = new Promise((resolve, reject) => {
    dump.on('error', reject);
    dump.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pg_dump falló con código ${code}: ${stderr}`));
    });
  });

  await Promise.all([
    pipeline(dump.stdout, zlib.createGzip({ level: 9 }), fs.createWriteStream(outputPath)),
    dumpClosed,
  ]);
}

async function uploadBackup(filePath) {
  const uploadUrl = process.env.BACKUP_UPLOAD_URL;
  if (!uploadUrl) {
    console.log('BACKUP_UPLOAD_URL no definido. Se omite subida HTTP.');
    return null;
  }

  if (/^postgres(?:ql)?:\/\//i.test(uploadUrl)) {
    throw new Error(
      'BACKUP_UPLOAD_URL recibió una conexión PostgreSQL. Esa variable es solo para HTTP. '
      + 'Coloca la conexión Neon de backup en BACKUP_TARGET_DATABASE_URL y deja BACKUP_UPLOAD_URL vacío si no tienes endpoint HTTP.',
    );
  }

  if (!/^https?:\/\//i.test(uploadUrl)) {
    throw new Error('BACKUP_UPLOAD_URL debe ser una URL HTTP/HTTPS o debe quedar vacía.');
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

  console.log(`Subiendo backup a ${redactUrl(uploadUrl)}`);
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

function assertRestoreSafety(targetUrl) {
  if (!isTrue(process.env.BACKUP_RESTORE_TO_TARGET)) {
    console.log('BACKUP_RESTORE_TO_TARGET no está en true. Se omite restauración a DB destino.');
    return false;
  }

  if (!targetUrl) throw new Error('BACKUP_RESTORE_TO_TARGET=true requiere BACKUP_TARGET_DATABASE_URL.');

  if (process.env.BACKUP_TARGET_CONFIRM !== 'I_UNDERSTAND_TARGET_WILL_BE_REPLACED') {
    throw new Error(
      'Por seguridad, define BACKUP_TARGET_CONFIRM=I_UNDERSTAND_TARGET_WILL_BE_REPLACED para permitir restaurar sobre la DB destino.',
    );
  }

  if (process.env.DATABASE_URL && process.env.DATABASE_URL === targetUrl) {
    throw new Error('DATABASE_URL y BACKUP_TARGET_DATABASE_URL son iguales. Se rechaza para no restaurar encima de producción.');
  }

  return true;
}

async function dropTargetSchemas(psqlBin, targetUrl) {
  if (!isTrue(process.env.BACKUP_TARGET_DROP_SCHEMAS_FIRST)) return;

  const schemas = backupSchemas().filter((schema) => schema !== 'public');
  if (!schemas.length) return;

  const quoteLiteral = (value) => `'${String(value).replace(/'/g, "''")}'`;
  const schemaArray = `ARRAY[${schemas.map(quoteLiteral).join(',')}]`;
  const sql = `
DO $$
DECLARE
  schema_name text;
BEGIN
  FOREACH schema_name IN ARRAY ${schemaArray}
  LOOP
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  END LOOP;
END $$;
`;

  console.log('Limpiando schemas destino antes del restore. No se imprimen credenciales.');
  await runProcess(psqlBin, [targetUrl, '-v', 'ON_ERROR_STOP=1', '-c', sql]);
}

async function gunzipToSqlFile(gzipPath) {
  const sqlPath = gzipPath.replace(/\.gz$/i, '') || `${gzipPath}.sql`;
  await pipeline(fs.createReadStream(gzipPath), zlib.createGunzip(), fs.createWriteStream(sqlPath));
  return sqlPath;
}

async function restoreBackupToTargetDatabase(filePath) {
  const targetUrl = process.env.BACKUP_TARGET_DATABASE_URL;
  if (!assertRestoreSafety(targetUrl)) return null;

  const psqlBin = assertBinaryAvailable('psql', 'PSQL_BIN');
  console.log('Restaurando backup hacia BACKUP_TARGET_DATABASE_URL. No se imprimen credenciales.');

  await dropTargetSchemas(psqlBin, targetUrl);

  const sqlPath = await gunzipToSqlFile(filePath);
  const args = [targetUrl, '-v', 'ON_ERROR_STOP=1'];
  if (isTrue(process.env.BACKUP_TARGET_SINGLE_TRANSACTION)) args.push('--single-transaction');
  args.push('-f', sqlPath);

  try {
    await runProcess(psqlBin, args);
  } finally {
    if (isTrue(process.env.BACKUP_DELETE_TEMP_SQL_AFTER_RESTORE) !== false) {
      await fs.promises.rm(sqlPath, { force: true });
    }
  }

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

  if (isTrue(process.env.BACKUP_DELETE_LOCAL_AFTER_UPLOAD) && (process.env.BACKUP_UPLOAD_URL || isTrue(process.env.BACKUP_RESTORE_TO_TARGET))) {
    await fs.promises.rm(outputPath, { force: true });
    console.log('Archivo local temporal eliminado después de subir/restaurar.');
  }
}

main().catch((error) => {
  console.error('BACKUP FAILED:', error?.stack || error?.message || error);
  process.exit(1);
});
