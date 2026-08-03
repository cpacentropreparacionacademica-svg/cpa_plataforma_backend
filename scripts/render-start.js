#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { prepareDatabase } = require('./startup-db');

const root = process.cwd();
const candidates = [
  path.join(root, 'dist', 'main.js'),
  path.join(root, 'dist', 'src', 'main.js'),
];

const entry = candidates.find((candidate) => fs.existsSync(candidate));

if (!entry) {
  console.error('No se encontró el archivo compilado de arranque.');
  console.error('Rutas revisadas:');
  for (const candidate of candidates) {
    console.error(`- ${path.relative(root, candidate)}`);
  }

  const distPath = path.join(root, 'dist');
  if (fs.existsSync(distPath)) {
    console.error('\nContenido de dist encontrado:');
    const walk = (dir, prefix = '') => {
      for (const item of fs.readdirSync(dir).sort()) {
        const full = path.join(dir, item);
        const rel = path.join(prefix, item);
        console.error(`- ${rel}`);
        if (fs.statSync(full).isDirectory()) {
          walk(full, rel);
        }
      }
    };
    walk(distPath);
  } else {
    console.error('\nLa carpeta dist no existe. El build no generó salida compilada.');
  }

  process.exit(1);
}

function startServer() {
  console.log(`Arrancando backend desde ${path.relative(root, entry)}`);

  const child = spawn(process.execPath, [entry], {
    stdio: 'inherit',
    env: process.env,
  });

  // Con dumb-init como PID 1 las señales llegan a este proceso, no al hijo:
  // hay que reenviarlas para que Nest cierre ordenadamente.
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => child.kill(signal));
  }

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

// Migraciones pendientes + seeds idempotentes antes de aceptar tráfico.
// Si esto falla, el proceso muere: es preferible a servir con un esquema o un
// catálogo desactualizado. Se desactiva con MIGRATE_ON_START/SEED_ON_START=false.
prepareDatabase(root)
  .then(startServer)
  .catch((error) => {
    console.error('No se pudo preparar la base de datos; el backend no arrancará.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
