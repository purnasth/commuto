import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';

import { USER_ROLE } from '../constants/enums';

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

  @IsEnum(USER_ROLE)
  role: USER_ROLE;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  // `ratings` is deliberately not accepted here. It is a trust signal derived
  // from other users' feedback, so letting a new account set its own would
  // make it meaningless.
}

/**
 * Profile fields a user may change about themselves.
 *
 * Everything else is excluded on purpose: email and password have their own
 * flows, and role, ratings, karmaPoints and creditScore are earned or
 * system-owned. Combined with the global whitelisting ValidationPipe, a field
 * absent here cannot reach the database.
 */
export class UpdateUserFieldsDto {
  @IsOptional()
  @IsString()
  fullname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;
}

export class UpdateUserDto {
  /** Current password, re-checked before any profile change is applied. */
  @IsString()
  password: string;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserFieldsDto)
  updates: UpdateUserFieldsDto;
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
