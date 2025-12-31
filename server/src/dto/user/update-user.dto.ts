import { IsString, IsOptional, IsNumber } from 'class-validator';

/**
 * Update User DTO - Fields that can be updated by the user
 * Email and password are intentionally excluded for security
 */
export class UpdateUserDto {
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

  @IsOptional()
  @IsNumber()
  ratings?: number;
}

/**
 * Update User Request DTO - Includes password for verification
 */
export class UpdateUserRequestDto {
  @IsString()
  password: string; // Current password for verification

  updates: UpdateUserDto;
}
