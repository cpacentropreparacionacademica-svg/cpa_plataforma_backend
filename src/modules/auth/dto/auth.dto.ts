import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  /**
   * Identificador de login. Por compatibilidad histórica el campo se llama `email`,
   * pero ahora acepta correo real o `nombre_usuario` interno.
   * Ejemplos: `pablo.admin`, `maria.contador`, `katia.admin`.
   */
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  nombre_usuario?: string;

  @IsString()
  @IsOptional()
  usuario?: string;

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
