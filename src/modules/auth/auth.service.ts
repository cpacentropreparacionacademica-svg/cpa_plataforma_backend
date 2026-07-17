import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PasswordHasherService } from '../../common/security/password-hasher.service';
import { OpaqueSessionService } from '../../common/services/opaque-session.service';
import { AuthRepository, DbUser } from './auth.repository';
import { ActivateUserDto, ChangePasswordDto, LoginDto, RequestPasswordTokenDto, SignupDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly sessions: OpaqueSessionService,
    private readonly passwords: PasswordHasherService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, params: { ip?: string | null; userAgent?: string | null }, response: Response) {
    const identifier = String(dto.email || dto.nombre_usuario || dto.usuario || '').trim();
    if (!identifier) throw new UnauthorizedException('Credenciales inválidas.');

    const user = await this.repository.getUserByLoginIdentifier(identifier);
    const verification = user
      ? await this.passwords.verify(dto.password, user.contrasena_hash)
      : { valid: false, needsUpgrade: false };
    if (!user || !verification.valid) throw new UnauthorizedException('Credenciales inválidas.');

    if (verification.needsUpgrade) {
      await this.repository.upgradePasswordHash(String(user.id_persona), dto.password, user.contrasena_hash);
    }

    const createdSession = await this.sessions.createSession({
      idPersona: String(user.id_persona),
      ip: params.ip,
      userAgent: params.userAgent,
    });
    this.setSessionCookie(response, createdSession.token);
    const sessionPayload = await this.buildSessionPayload(user, createdSession.session, createdSession.token);
    return { success: true, message: 'Login exitoso.', data: sessionPayload };
  }

  async signup(dto: SignupDto) {
    if (this.config.get<string>('ENABLE_PUBLIC_SIGNUP', 'false') !== 'true') {
      throw new ForbiddenException('El registro público está deshabilitado.');
    }
    if (await this.repository.getUserByIdPersona(dto.id_persona)) {
      throw new ConflictException('La persona ya tiene usuario registrado.');
    }
    const user = await this.repository.createUser(dto);
    return { success: true, message: 'Usuario creado correctamente.', data: { user: user ? this.toSafeUser(user) : null } };
  }

  async me(personId?: string | null) {
    if (!personId) throw new UnauthorizedException('Usuario no autenticado.');
    const user = await this.repository.getUserByIdPersona(personId);
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return { success: true, message: 'Sesión obtenida correctamente.', data: await this.buildSessionPayload(user) };
  }

  async logout(sessionToken: string | undefined, response: Response) {
    if (sessionToken) await this.sessions.closeSession(sessionToken);
    this.clearSessionCookie(response);
    return { success: true, message: 'Sesión cerrada correctamente.' };
  }

  async changePassword(dto: ChangePasswordDto) {
    const user = await this.repository.getUserByEmail(dto.email);
    if (!user || !(await this.repository.consumeActionToken(String(user.id_persona), 'CAMBIAR_CONTRASENA', dto.token_confirm))) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
    await this.repository.updatePassword(String(user.id_persona), dto.new_password);
    return { success: true, message: 'Contraseña actualizada correctamente.', data: {} };
  }

  async activateUser(dto: ActivateUserDto) {
    const user = await this.repository.getUserByEmail(dto.email);
    if (!user || !(await this.repository.consumeActionToken(String(user.id_persona), 'VALIDAR_USUARIO', dto.token_confirm))) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
    await this.repository.activateUser(String(user.id_persona));
    return { success: true, message: 'Usuario activado correctamente.', data: {} };
  }

  async requestNewPasswordToken(dto: RequestPasswordTokenDto) {
    const user = await this.repository.getUserByEmail(dto.email);
    const token = user ? await this.repository.generateActionToken(String(user.id_persona), 'CAMBIAR_CONTRASENA') : null;
    return {
      success: true,
      message: 'Si la cuenta existe, se generó una instrucción de recuperación.',
      data: this.config.get<string>('NODE_ENV') === 'test' ? token : undefined,
    };
  }

  private async buildSessionPayload(user: DbUser, session?: unknown, sessionToken?: string) {
    const [roles, permissions] = await Promise.all([
      this.repository.getRolesByIdPersona(String(user.id_persona)),
      this.repository.getEffectivePermissionsByIdPersona(String(user.id_persona)),
    ]);
    const normalizedPermissions = permissions.map((permission) => ({
      ...permission,
      id_permiso: String(permission.id_permiso),
      idPermiso: String(permission.id_permiso),
      codigoPermiso: permission.codigo,
      moduloPermiso: permission.modulo ?? null,
      descripcionPermiso: permission.descripcion ?? null,
      fuentePermiso: permission.fuente,
    }));
    const normalizedRoles = roles.map((role) => ({
      ...role,
      id_rol: String(role.id_rol),
      idRol: String(role.id_rol),
      codigoRol: role.codigo,
      nombreRol: role.nombre,
    }));
    return {
      user: this.toSafeUser(user),
      session: session ? { ...(session as Record<string, unknown>), permissions: normalizedPermissions, permisos: normalizedPermissions } : undefined,
      sessionToken,
      tokenType: sessionToken ? 'Opaque' : undefined,
      roles: normalizedRoles,
      roles_usuario: normalizedRoles,
      permissions: normalizedPermissions,
      permisos: normalizedPermissions,
      permissionCodes: normalizedPermissions.map((permission) => permission.codigo),
      codigosPermiso: normalizedPermissions.map((permission) => permission.codigo),
    };
  }

  private setSessionCookie(response: Response, token: string): void {
    response.cookie(this.config.get<string>('SESSION_COOKIE_NAME', 'cpa_session'), token, this.cookieOptions());
  }

  private clearSessionCookie(response: Response): void {
    response.clearCookie(this.config.get<string>('SESSION_COOKIE_NAME', 'cpa_session'), this.cookieOptions());
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<string>('SESSION_COOKIE_SECURE', 'false') === 'true',
      sameSite: this.config.get<'lax' | 'strict' | 'none'>('SESSION_SAME_SITE', 'lax'),
      maxAge: Number(this.config.get<string>('SESSION_TTL_MINUTES', '480')) * 60 * 1000,
      path: '/',
    } as const;
  }

  private toSafeUser(user: DbUser) {
    const { contrasena_hash: _password, ...safeUser } = user;
    return { ...safeUser, idPersona: String(user.id_persona), id_persona: String(user.id_persona) };
  }
}
