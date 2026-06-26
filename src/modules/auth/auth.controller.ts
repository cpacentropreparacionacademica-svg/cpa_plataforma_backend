import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ActivateUserDto, ChangePasswordDto, LoginDto, RequestPasswordTokenDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('publicAuth/login')
  login(@Body() body: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.auth.login(body, { ip: request.ip, userAgent: request.header('user-agent') }, response);
  }

  // No existe endpoint público de signup.
  // CPA Plataforma es un sistema interno: los usuarios se crean por seed o por flujo interno autorizado de administración.

  @Public()
  @Post('publicAuth/change-password')
  changePassword(@Body() body: ChangePasswordDto) {
    return this.auth.changePassword(body);
  }

  @Public()
  @Post('publicAuth/activate-user')
  activateUser(@Body() body: ActivateUserDto) {
    return this.auth.activateUser(body);
  }

  @Public()
  @Post('publicAuth/request-new-password-token')
  requestNewPasswordToken(@Body() body: RequestPasswordTokenDto) {
    return this.auth.requestNewPasswordToken(body);
  }

  @Get('privateAuth/me')
  me(@Req() request: Request) {
    return this.auth.me(request.user?.idPersona);
  }

  @Post('privateAuth/me')
  mePost(@Req() request: Request) {
    return this.auth.me(request.user?.idPersona);
  }

  @Post('privateAuth/refresh-session')
  refreshSession(@Req() request: Request) {
    return this.auth.me(request.user?.idPersona);
  }

  @Post('privateAuth/refreshSession')
  refreshSessionAlias(@Req() request: Request) {
    return this.auth.me(request.user?.idPersona);
  }

  @Post('privateAuth/logout')
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.auth.logout(request.sessionToken, response);
  }
}
