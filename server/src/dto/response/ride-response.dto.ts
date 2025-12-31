import { Exclude, Expose, Type } from 'class-transformer';

import { PublicUserDto } from '../user/user-response.dto';

/**
 * Ride List Response DTO - For ride listings (GET /rides, GET /rides/match)
 * Only includes safe, public information
 */
export class RideListResponseDto {
  @Expose()
  id: number;

  @Expose()
  from: string;

  @Expose()
  to: string;

  @Expose()
  fromLat?: number;

  @Expose()
  fromLng?: number;

  @Expose()
  toLat?: number;

  @Expose()
  toLng?: number;

  @Expose()
  message?: string;

  @Expose()
  role: string;

  @Expose()
  status: string;

  @Expose()
  estimatedTimeOfArrival?: number;

  @Expose()
  timestamp: Date;

  @Expose()
  distance?: number;

  @Expose()
  co2Saved?: number;

  @Expose()
  matchGroupId?: string;

  // Include ONLY safe rider info (no email, phone, etc.)
  @Expose()
  @Type(() => PublicUserDto)
  rider?: PublicUserDto;

  // Exclude internal database fields
  @Exclude()
  riderId?: number;

  @Exclude()
  passengerId?: number;

  @Exclude()
  createdBy: number;

  @Exclude()
  createdByUser?: any;

  constructor(partial: Partial<RideListResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Ride Detail Response DTO - For detailed ride view (GET /rides/:id)
 * Includes more information but still filtered
 */
export class RideDetailResponseDto extends RideListResponseDto {
  @Expose()
  @Type(() => PublicUserDto)
  passengers?: PublicUserDto[];

  @Expose()
  peopleImpacted?: number;

  // Still exclude sensitive relations
  @Exclude()
  requests?: any[];

  @Exclude()
  ratings?: any[];

  @Exclude()
  messages?: any[];

  @Exclude()
  feedback?: any[];

  constructor(partial: Partial<RideDetailResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

/**
 * Ride History Response DTO - For ride history (GET /rides/history)
 */
export class RideHistoryResponseDto extends RideDetailResponseDto {
  @Expose()
  completedAt?: Date;

  constructor(partial: Partial<RideHistoryResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

/**
 * Current Ride Response DTO - For current active ride
 */
export class CurrentRideResponseDto extends RideDetailResponseDto {
  constructor(partial: Partial<CurrentRideResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
