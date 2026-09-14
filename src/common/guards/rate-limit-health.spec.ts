import { isHealthProbe } from './in-memory-rate-limit.guard';

/**
 * El healthcheck de Docker pega cada 30 s a `/api/health/live` desde 127.0.0.1. Con el cupo de
 * 100 por ventana de 15 min, sumado al tráfico real, el contenedor se marcaba «unhealthy» por un
 * 429 que no era del negocio (medido el 2026-09-13 en Coolify). Las sondas no cuentan.
 */
describe('isHealthProbe', () => {
  it.each(['/api/health', '/api/health/live', '/api/health/ready', '/health/live', '/api/health/live/'])(
    'reconoce %s como sonda',
    (path) => expect(isHealthProbe(path)).toBe(true),
  );

  it.each(['/api/healthcheck', '/api/auth/publicAuth/login', '/api/health/other', '/api/ventas'])(
    'no exime %s',
    (path) => expect(isHealthProbe(path)).toBe(false),
  );
});
