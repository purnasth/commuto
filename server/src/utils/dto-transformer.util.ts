import { plainToInstance, ClassConstructor } from 'class-transformer';
import { User, Ride, Feedback } from 'generated/prisma';

import {
  RideListResponseDto,
  RideDetailResponseDto,
  RideHistoryResponseDto,
  CurrentRideResponseDto,
} from '../dto/response/ride-response.dto';
import { FeedbackResponseDto } from '../dto/response/feedback-response.dto';
import { UserResponseDto, PublicUserDto } from '../dto/user/user-response.dto';

/**
 * Generic DTO transformer utility
 * Transforms Prisma entities to DTOs, excluding sensitive fields
 *
 * @param cls - The DTO class to transform to
 * @param plain - The plain object or array to transform
 * @returns Transformed DTO instance or array
 */
export function toDto<T, V>(cls: ClassConstructor<T>, plain: V | V[]): T | T[] {
  return plainToInstance(cls, plain, {
    excludeExtraneousValues: true, // Only include @Expose() properties
    enableImplicitConversion: true,
  });
}

/**
 * Transform user object to public DTO (for other users to see)
 * Excludes email, phone, address, karma points, credit score
 */
export function toPublicUser(user: User): PublicUserDto {
  return toDto(PublicUserDto, user) as PublicUserDto;
}

/**
 * Transform multiple users to public DTOs
 */
export function toPublicUsers(users: User[]): PublicUserDto[] {
  return toDto(PublicUserDto, users) as PublicUserDto[];
}

/**
 * Transform user object to authenticated user response DTO
 * Includes personal information but excludes password
 */
export function toUserResponse(user: User): UserResponseDto {
  return toDto(UserResponseDto, user) as UserResponseDto;
}

/**
 * Transform ride object to list response DTO
 * The @Type() decorator in RideListResponseDto automatically transforms nested relations
 */
export function toRideListResponse(
  ride: Ride & { rider?: User | null; passengers?: User[] },
): RideListResponseDto {
  return toDto(RideListResponseDto, ride) as RideListResponseDto;
}

/**
 * Transform multiple rides to list response DTOs
 */
export function toRideListResponses(
  rides: (Ride & { rider?: User | null; passengers?: User[] })[],
): RideListResponseDto[] {
  return rides.map((ride) => toRideListResponse(ride));
}

/**
 * Transform ride object to detail response DTO
 * The @Type() decorator in RideDetailResponseDto automatically transforms nested relations
 */
export function toRideDetailResponse(
  ride: Ride & { rider?: User | null; passengers?: User[] },
): RideDetailResponseDto {
  return toDto(RideDetailResponseDto, ride) as RideDetailResponseDto;
}

/**
 * Transform ride object to history response DTO
 * The @Type() decorator in RideHistoryResponseDto automatically transforms nested relations
 */
export function toRideHistoryResponse(
  ride: Ride & { rider?: User | null; passengers?: User[] },
): RideHistoryResponseDto {
  return toDto(RideHistoryResponseDto, ride) as RideHistoryResponseDto;
}

/**
 * Transform multiple rides to history response DTOs
 */
export function toRideHistoryResponses(
  rides: (Ride & { rider?: User | null; passengers?: User[] })[],
): RideHistoryResponseDto[] {
  return rides.map((ride) => toRideHistoryResponse(ride));
}

/**
 * Transform ride object to current ride response DTO
 * The @Type() decorator in CurrentRideResponseDto automatically transforms nested relations
 */
export function toCurrentRideResponse(
  ride: Ride & { rider?: User | null; passengers?: User[] },
): CurrentRideResponseDto {
  return toDto(CurrentRideResponseDto, ride) as CurrentRideResponseDto;
}

/**
 * Transform feedback object to response DTO
 */
export function toFeedbackResponse(feedback: Feedback): FeedbackResponseDto {
  return toDto(FeedbackResponseDto, feedback) as FeedbackResponseDto;
}
