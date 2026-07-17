import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsOptional()
  @MaxLength(254)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre_usuario?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  usuario?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  id_persona!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_usuario!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipo_usuario?: string;
}

export class ChangePasswordDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Matches(/^\d{6,9}$/)
  token_confirm!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  new_password!: string;
}

export class ActivateUserDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Matches(/^\d{6,9}$/)
  token_confirm!: string;
}

export class RequestPasswordTokenDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
