import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { parseCorsOrigins } from '../../config/environment.schema';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Rejects cross-origin state-changing requests authenticated by browser cookie.
 * Header-authenticated trusted clients are not subject to browser CSRF semantics.
 */
@Injectable()
export class CsrfOriginGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(private readonly reflector: Reflector, config: ConfigService) {
    this.allowedOrigins = new Set(parseCorsOrigins(config.get<string>('CORS_ORIGINS', '')));
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method) || request.sessionTransport !== 'cookie') return true;

    const origin = request.header('origin');
    if (!origin || !this.allowedOrigins.has(origin)) {
      throw new ForbiddenException('Origen de solicitud no autorizado.');
    }
    return true;
  }
}
