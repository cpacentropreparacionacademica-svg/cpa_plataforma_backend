import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  id_persona!: string;

  @IsString()
  @IsNotEmpty()
  nombre_usuario!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsString()
  tipo_usuario?: string;
}

export class ChangePasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  token_confirm!: string;

  @IsString()
  @IsNotEmpty()
  new_password!: string;
}

export class ActivateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  token_confirm!: string;
}

export class RequestPasswordTokenDto {
  @IsEmail()
  email!: string;
}
