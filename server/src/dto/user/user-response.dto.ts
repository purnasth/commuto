import { Exclude, Expose } from 'class-transformer';

/**
 * User Response DTO - For authenticated user's own profile
 * Includes personal information but excludes sensitive fields like password
 */
export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  fullname: string;

  @Expose()
  email: string;

  @Expose()
  role: string;

  @Expose()
  phone?: string;

  @Expose()
  address?: string;

  @Expose()
  profilePicture?: string;

  @Expose()
  ratings?: number;

  @Expose()
  karmaPoints: number;

  @Expose()
  creditScore: number;

  // Exclude sensitive fields
  @Exclude()
  password: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Public User DTO - For public profiles (what other users see)
 * Only includes non-sensitive information
 */
export class PublicUserDto {
  @Expose()
  id: number;

  @Expose()
  fullname: string;

  @Expose()
  profilePicture?: string;

  @Expose()
  ratings?: number;

  // Explicitly exclude all sensitive fields
  @Exclude()
  email: string;

  @Exclude()
  password: string;

  @Exclude()
  phone?: string;

  @Exclude()
  address?: string;

  @Exclude()
  karmaPoints: number;

  @Exclude()
  creditScore: number;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  constructor(partial: Partial<PublicUserDto>) {
    Object.assign(this, partial);
  }
}
