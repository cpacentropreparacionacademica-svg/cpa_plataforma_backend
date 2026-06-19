import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { OpaqueSessionService } from '../../common/services/opaque-session.service';
import { safeCompare, sha256 } from '../../common/utils/crypto.util';
import { AuthRepository, DbUser } from './auth.repository';
import { LoginDto, SignupDto, ChangePasswordDto, ActivateUserDto, RequestPasswordTokenDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly sessions: OpaqueSessionService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, params: { ip?: string | null; userAgent?: string | null }, response: Response) {
    const user = await this.repository.getUserByEmail(dto.email);
    if (!user || !safeCompare(sha256(dto.password), user.contrasena_hash)) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const createdSession = await this.sessions.createSession({ idPersona: String(user.id_persona), ip: params.ip, userAgent: params.userAgent });
    this.setSessionCookie(response, createdSession.token);

    return {
      success: true,
      message: 'Login exitoso.',
      data: {
        user: this.toSafeUser(user),
        session: createdSession.session,
        sessionToken: createdSession.token,
        tokenType: 'Opaque',
      },
    };
  }

  async signup(dto: SignupDto) {
    const publicSignupEnabled = this.config.get<string>('ENABLE_PUBLIC_SIGNUP', 'false') === 'true';
    if (!publicSignupEnabled) {
      throw new ForbiddenException('El registro público está deshabilitado. Crea usuarios desde base de datos o desde un flujo interno autorizado.');
    }

    const existing = await this.repository.getUserByIdPersona(dto.id_persona);
    if (existing) throw new ConflictException('La persona ya tiene usuario registrado.');
    const user = await this.repository.createUser(dto);
    return { success: true, message: 'Usuario creado correctamente.', data: { user: user ? this.toSafeUser(user) : null } };
  }

  async me(idPersona?: string | null) {
    if (!idPersona) throw new UnauthorizedException('Usuario no autenticado.');
    const user = await this.repository.getUserByIdPersona(idPersona);
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return { success: true, message: 'Sesión obtenida correctamente.', data: { user: this.toSafeUser(user) } };
  }

  async logout(sessionToken: string | undefined, response: Response) {
    if (sessionToken) await this.sessions.closeSession(sessionToken);
    this.clearSessionCookie(response);
    return { success: true, message: 'Sesión cerrada correctamente.' };
  }

  async changePassword(dto: ChangePasswordDto) {
    const user = await this.repository.getUserByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas.');
    await this.consumeActionToken(String(user.id_persona), 'CAMBIAR_CONTRASENA', dto.token_confirm);
    await this.repository.updatePassword(String(user.id_persona), dto.new_password);
    return { success: true, message: 'Contraseña actualizada correctamente.', data: {} };
  }

  async activateUser(dto: ActivateUserDto) {
    const user = await this.repository.getUserByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas.');
    await this.consumeActionToken(String(user.id_persona), 'VALIDAR_USUARIO', dto.token_confirm);
    await this.repository.activateUser(String(user.id_persona));
    return { success: true, message: 'Usuario activado correctamente.', data: {} };
  }

  async requestNewPasswordToken(dto: RequestPasswordTokenDto) {
    const user = await this.repository.getUserByEmail(dto.email);
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    const token = await this.repository.generateActionToken(String(user.id_persona), 'CAMBIAR_CONTRASENA');
    return {
      success: true,
      message: 'Token generado correctamente.',
      data: this.config.get<string>('NODE_ENV') === 'production' ? undefined : token,
    };
  }

  private async consumeActionToken(idPersona: string, action: string, plainToken: string): Promise<void> {
    const token = await this.repository.getAvailableActionToken(idPersona, action);
    if (!token || !safeCompare(sha256(plainToken), token.token_hash)) {
      throw new BadRequestException('Token inválido o expirado.');
    }
    await this.repository.markTokensAsUsed(idPersona, action);
  }

  private setSessionCookie(response: Response, token: string): void {
    const cookieName = this.config.get<string>('SESSION_COOKIE_NAME', 'cpa_session');
    response.cookie(cookieName, token, {
      httpOnly: true,
      secure: this.config.get<string>('SESSION_COOKIE_SECURE', 'false') === 'true',
      sameSite: this.config.get<'lax' | 'strict' | 'none'>('SESSION_SAME_SITE', 'lax'),
      maxAge: Number(this.config.get<string>('SESSION_TTL_MINUTES', '480')) * 60 * 1000,
      path: '/',
    });
  }

  private clearSessionCookie(response: Response): void {
    const cookieName = this.config.get<string>('SESSION_COOKIE_NAME', 'cpa_session');
    response.clearCookie(cookieName, { httpOnly: true, path: '/' });
  }

  private toSafeUser(user: DbUser) {
    const { contrasena_hash: _password, ...safeUser } = user;
    return { ...safeUser, idPersona: String(user.id_persona), id_persona: String(user.id_persona) };
  }
}
