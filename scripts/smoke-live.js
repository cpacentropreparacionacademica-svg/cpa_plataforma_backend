#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    if (!process.env[key.trim()]) process.env[key.trim()] = rest.join('=').replace(/^['\"]|['\"]$/g, '').trim();
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));

const baseUrl = (process.env.SMOKE_BASE_URL || process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const login = process.env.SMOKE_LOGIN || process.env.TEST_USER_EMAIL || 'pablo.admin@cpa.com';
const password = process.env.SMOKE_PASSWORD || process.env.TEST_USER_PASSWORD || 'PabloAdmin2026!';

const criticalRoutes = [
  '/api/health',
  '/api/infraestructura/aula?limit=5',
  '/api/infraestructura/espacio?limit=5',
  '/api/servicios_educativos/materia-tree?limit=5',
  '/api/personas/unidad-educativa?limit=5',
  '/api/servicios_educativos/producto-educativo?limit=5',
  '/api/contabilidad/configuracion-cuenta-operativa?limit=5',
  '/api/contabilidad/cuenta?limit=5',
  '/api/contabilidad/venta-clase-registro?limit=5',
];

async function requestJson(url, options = {}) {
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${url} -> ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return { response, body };
}

(async () => {
  console.log(`Smoke live contra: ${baseUrl}`);
  await requestJson('/api/health');
  const loginResponse = await requestJson('/api/auth/publicAuth/login', {
    method: 'POST',
    body: JSON.stringify({ email: login, password }),
  });
  const token = loginResponse.body?.data?.sessionToken;
  if (!token) throw new Error('Login no devolvió data.sessionToken.');
  console.log(`Login OK: ${login}`);

  for (const route of criticalRoutes) {
    const headers = route === '/api/health' ? {} : { 'X-Session-Token': token };
    const { body } = await requestJson(route, { headers });
    const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body?.rows) ? body.rows : [];
    console.log(`OK ${route} rows=${rows.length}`);
  }

  await requestJson('/api/contabilidad/cuenta/batch/validate', {
    method: 'POST',
    headers: { 'X-Session-Token': token },
    body: JSON.stringify({ mode: 'create', items: [{ codigo: 'SMOKE-LIVE', nombre_cuenta: 'Smoke Live' }] }),
  });
  console.log('OK batch/validate JSON');

  await requestJson('/api/auth/privateAuth/logout', {
    method: 'POST',
    headers: { 'X-Session-Token': token },
    body: JSON.stringify({}),
  });
  console.log('Smoke live completado correctamente.');
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
