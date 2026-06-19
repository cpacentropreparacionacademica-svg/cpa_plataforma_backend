import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RESOURCE_MODULE_KEY } from '../decorators/resource-module.decorator';
import { PermissionService } from '../services/permission.service';
import { AuthUser } from '../types/auth-user.type';
import { getResourceConfig } from '../../modules/resource-registry';

type RequestWithAuth = Request & {
  user?: AuthUser;
};

type CrudAction = 'create' | 'read' | 'update';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly permissions: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const authRequired = this.config.get<string>('AUTH_REQUIRED', 'true') === 'true';
    if (!authRequired) return true;

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }

    if (user.es_super_usuario) return true;

    const moduleName = this.reflector.getAllAndOverride<string>(RESOURCE_MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const resourcePath = this.normalizeParam(request.params?.resourcePath);

    if (!moduleName || !resourcePath) return true;

    const resource = getResourceConfig(moduleName, resourcePath);
    if (!resource) return true;

    const action = this.resolveCrudAction(request.method);
    const requiredPermission = resource.permissions?.[action];

    if (!requiredPermission) return true;

    const userId = user.idPersona ?? user.id_persona;
    const hasPermission = await this.permissions.hasPermission(String(userId), requiredPermission);

    if (!hasPermission) {
      throw new ForbiddenException(`No tienes permiso para ejecutar ${requiredPermission}.`);
    }

    return true;
  }

  private normalizeParam(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }

  private resolveCrudAction(method: string): CrudAction {
    if (method === 'POST') return 'create';
    if (method === 'PUT' || method === 'PATCH') return 'update';
    return 'read';
  }
}
