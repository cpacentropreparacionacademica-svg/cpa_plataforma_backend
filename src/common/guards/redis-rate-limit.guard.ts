import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { getPositiveInteger } from '../../config/runtime-config.util';
import { BoundedRateLimitStore } from '../security/bounded-rate-limit.store';
import { RedisService } from '../services/redis.service';
import { sha256 } from '../utils/crypto.util';

@Injectable()
export class RedisRateLimitGuard implements CanActivate {
  private readonly fallbackStore = new BoundedRateLimitStore();

  constructor(private readonly config: ConfigService, private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    if (request.method === 'OPTIONS') return true;

    const isLogin = request.path.endsWith('/auth/publicAuth/login');
    const windowMs = getPositiveInteger(this.config, isLogin ? 'LOGIN_RATE_LIMIT_WINDOW_MS' : 'RATE_LIMIT_WINDOW_MS', 900000);
    const maximumRequests = getPositiveInteger(this.config, isLogin ? 'LOGIN_RATE_LIMIT_MAX' : 'RATE_LIMIT_MAX', isLogin ? 10 : 100);
    const maximumBuckets = getPositiveInteger(this.config, 'RATE_LIMIT_FALLBACK_MAX_BUCKETS', 10000);
    const key = this.buildKey(request, isLogin);
    const redisCount = await this.redis.incrementWithTtl(key, Math.ceil(windowMs / 1000));
    const fallbackBucket = redisCount === null ? this.fallbackStore.increment(key, windowMs, maximumBuckets) : null;
    const count = redisCount ?? fallbackBucket?.count ?? 1;

    response.setHeader('X-RateLimit-Limit', String(maximumRequests));
    response.setHeader('X-RateLimit-Remaining', String(Math.max(0, maximumRequests - count)));

    if (count > maximumRequests) {
      const resetAt = fallbackBucket?.resetAt ?? Date.now() + windowMs;
      response.setHeader('Retry-After', String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))));
      throw new HttpException('Demasiadas solicitudes. Intenta nuevamente más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }

  private buildKey(request: Request, isLogin: boolean): string {
    const clientIp = request.ip || request.socket.remoteAddress || 'unknown';
    const route = String(request.route?.path || request.path)
      .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')
      .replace(/\/\d+(?=\/|$)/g, '/:id');
    if (!isLogin) return `rate-limit:${clientIp}:${request.method}:${route}`;

    const body = request.body as Record<string, unknown> | undefined;
    const identifier = String(body?.email || body?.nombre_usuario || body?.usuario || '').trim().toLowerCase();
    const accountKey = identifier ? sha256(identifier).slice(0, 16) : 'missing';
    return `rate-limit:login:${clientIp}:${accountKey}`;
  }
}
