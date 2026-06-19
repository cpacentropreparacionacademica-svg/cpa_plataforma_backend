import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class InMemoryRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.method === 'OPTIONS') return true;

    const windowMs = Number(this.config.get<string>('RATE_LIMIT_WINDOW_MS', '900000'));
    const max = Number(this.config.get<string>('RATE_LIMIT_MAX', '100'));
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const key = `${ip}:${request.method}:${request.path}`;
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    current.count += 1;
    if (current.count > max) {
      throw new HttpException('Demasiadas solicitudes. Intenta nuevamente más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
