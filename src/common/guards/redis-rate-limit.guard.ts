import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RedisService } from '../services/redis.service';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RedisRateLimitGuard implements CanActivate {
  private readonly fallbackBuckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.method === 'OPTIONS') return true;

    const windowMs = Number(this.config.get<string>('RATE_LIMIT_WINDOW_MS', '900000'));
    const max = Number(this.config.get<string>('RATE_LIMIT_MAX', '100'));
    const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const key = `rate-limit:${ip}:${request.method}:${request.path}`;

    const redisCount = await this.redis.incrementWithTtl(key, ttlSeconds);
    const count = redisCount ?? this.incrementFallbackBucket(key, windowMs);

    if (count > max) {
      throw new HttpException('Demasiadas solicitudes. Intenta nuevamente más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private incrementFallbackBucket(key: string, windowMs: number): number {
    const now = Date.now();
    const current = this.fallbackBuckets.get(key);

    if (!current || current.resetAt <= now) {
      this.fallbackBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return 1;
    }

    current.count += 1;
    return current.count;
  }
}
