import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { getPositiveInteger } from '../../config/runtime-config.util';
import { BoundedRateLimitStore } from '../security/bounded-rate-limit.store';

@Injectable()
export class InMemoryRateLimitGuard implements CanActivate {
  private readonly store = new BoundedRateLimitStore();

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.method === 'OPTIONS') return true;
    // Las sondas de salud no cuentan: el healthcheck de Docker pega cada 30 s desde 127.0.0.1 y,
    // sumado al tráfico del proxy, agotaba el cupo de 100 por ventana y dejaba el contenedor
    // «unhealthy» con un 429 que no era del negocio.
    if (isHealthProbe(request.path)) return true;
    const windowMs = getPositiveInteger(this.config, 'RATE_LIMIT_WINDOW_MS', 900000);
    const maximumRequests = getPositiveInteger(this.config, 'RATE_LIMIT_MAX', 100);
    const maximumBuckets = getPositiveInteger(this.config, 'RATE_LIMIT_FALLBACK_MAX_BUCKETS', 10000);
    const clientIp = request.ip || request.socket.remoteAddress || 'unknown';
    const routeKey = request.route?.path || request.path;
    const bucket = this.store.increment(`${clientIp}:${request.method}:${routeKey}`, windowMs, maximumBuckets);

    if (bucket.count > maximumRequests) {
      throw new HttpException('Demasiadas solicitudes. Intenta nuevamente más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}

/** `/api/health`, `/api/health/live` y `/api/health/ready`, con o sin prefijo global. */
export function isHealthProbe(path: string): boolean {
  return /(^|\/)health(\/(live|ready))?\/?$/.test(path);
}
