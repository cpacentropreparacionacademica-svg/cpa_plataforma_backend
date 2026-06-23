#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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

console.log(`Arrancando backend desde ${path.relative(root, entry)}`);

const child = spawn(process.execPath, [entry], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
