/**
 * Freno para los smokes que escriben de verdad.
 *
 * `smoke.full` y `smoke.imports-business` ponen `SMOKE_DRY_RUN_CRUD_WRITES=false`
 * y crean filas reales: personas, sucursales, edificios, aulas, transacciones
 * contables. Cada suite las borra al terminar, pero esa limpieza depende de que
 * `afterAll` llegue a ejecutarse; si el proceso muere antes, lo creado se queda.
 *
 * El `.env` del proyecto apunta a la base de producción (Neon), así que correr
 * `yarn test` sin pensarlo escribía y dejaba restos en la base real. El guard
 * corta eso: si el destino no es una base local, la suite falla al arrancar en
 * vez de tocar datos de producción.
 *
 * Para el caso legítimo —una base remota de staging descartable— se destraba con
 * `SMOKE_ALLOW_REMOTE_DB=true`, que obliga a escribirlo explícitamente y deja
 * constancia de la decisión.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0', 'host.docker.internal', 'db', 'postgres']);

function hostFromDatabaseUrl(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return '';
  }
}

/** Host al que apunta la configuración actual, priorizando PGHOST como hace `startup-db.js`. */
export function resolveSmokeTargetHost(): string {
  const pgHost = String(process.env.PGHOST || '').trim();
  if (pgHost) return pgHost;
  return hostFromDatabaseUrl(String(process.env.DATABASE_URL || '').trim());
}

export function assertSmokeTargetIsLocal(suiteName: string): void {
  if (String(process.env.SMOKE_ALLOW_REMOTE_DB || '').trim().toLowerCase() === 'true') return;

  const host = resolveSmokeTargetHost();
  if (!host) {
    throw new Error(
      `${suiteName} no puede arrancar: no hay PGHOST ni DATABASE_URL configurados, así que no se puede comprobar contra qué base escribiría.`,
    );
  }
  if (LOCAL_HOSTS.has(host.toLowerCase())) return;

  throw new Error(
    [
      `${suiteName} escribe en la base de datos y "${host}" no es una base local.`,
      '',
      'Esta suite crea personas, infraestructura y transacciones contables reales.',
      'Correrla contra producción deja residuos si la limpieza final no alcanza a ejecutarse.',
      '',
      'Apunta PGHOST/DATABASE_URL a una base local, o si de verdad quieres usar',
      'una base remota descartable, exporta SMOKE_ALLOW_REMOTE_DB=true.',
    ].join('\n'),
  );
}
