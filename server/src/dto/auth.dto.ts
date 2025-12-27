import { IsString, IsOptional, IsEmail } from 'class-validator';

export class LogoutDto {
  @IsString()
  refreshToken: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  recaptchaToken: string;
}

export class SignupDto {
  @IsString()
  fullname: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  ratings?: number;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class DeleteAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
