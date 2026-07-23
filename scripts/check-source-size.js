/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'src');
const exceptionsPath = path.join(root, 'docs', 'hardening', 'source-size-exceptions.json');
const exceptions = JSON.parse(fs.readFileSync(exceptionsPath, 'utf8'));
const warnings = [];
const failures = [];

for (const filePath of walk(sourceRoot)) {
  if (!filePath.endsWith('.ts')) continue;
  const relativePath = path.relative(root, filePath).replaceAll(path.sep, '/');
  // Un archivo terminado en salto de línea no tiene una línea final vacía adicional:
  // `split` la contaba y desplazaba cada medición en +1 respecto a los baselines.
  const lineCount = fs.readFileSync(filePath, 'utf8').replace(/\r?\n$/, '').split(/\r?\n/).length;
  const exception = exceptions[relativePath];

  if (lineCount >= 220) warnings.push(`${relativePath}: ${lineCount} lines`);
  if (lineCount <= 300) continue;

  if (!exception) {
    failures.push(`${relativePath}: ${lineCount} lines and no approved exception`);
    continue;
  }
  if (lineCount > exception.maximumLines) {
    failures.push(`${relativePath}: ${lineCount} lines exceeds approved baseline ${exception.maximumLines}`);
  }
}

if (warnings.length) {
  console.warn('Source-size warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}
if (failures.length) {
  console.error('Source-size policy violations:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Source-size policy passed. Existing exceptions did not grow.');
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolvedPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(resolvedPath) : [resolvedPath];
  });
}
