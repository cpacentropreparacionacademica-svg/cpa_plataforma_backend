import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { OpaqueSessionService } from '../services/opaque-session.service';

@Injectable()
export class OpaqueSessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly sessions: OpaqueSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const authRequired = this.config.get<string>('AUTH_REQUIRED', 'true') === 'true';
    const request = context.switchToHttp().getRequest<Request>();

    if (!authRequired) {
      request.user = {
        id_persona: '0',
        idPersona: '0',
        nombre_usuario: 'local-dev',
        tipo_usuario: 'DEV',
        es_super_usuario: true,
      };
      return true;
    }

    const token = this.extractSessionToken(request);
    if (!token) {
      throw new UnauthorizedException('Sesión no proporcionada. Inicia sesión nuevamente.');
    }

    const user = await this.sessions.getUserFromSessionToken(token);
    if (!user) {
      throw new UnauthorizedException('Sesión inválida, expirada o cerrada.');
    }

    request.sessionToken = token;
    request.user = user;
    return true;
  }

  private extractSessionToken(request: Request): string | null {
    const cookieName = this.config.get<string>('SESSION_COOKIE_NAME', 'cpa_session');
    const cookieToken = request.cookies?.[cookieName];
    const headerToken = request.header('x-session-token');
    return typeof cookieToken === 'string' ? cookieToken : typeof headerToken === 'string' ? headerToken : null;
  }
}
