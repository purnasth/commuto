import { Type } from 'class-transformer';
import {
  Max,
  Min,
  IsEnum,
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

import { USER_ROLE } from '../constants/enums';

/**
 * A new ride posting.
 *
 * This endpoint previously took a bare TypeScript interface, which the
 * validation pipe cannot act on -- so `role` arrived as arbitrary text and was
 * written straight to the database. That is how `User.role` came to hold
 * "Rider" while `Ride.role` held "rider". The enum below rejects anything else
 * at the edge, and the column is now an enum too.
 *
 * `createdBy` comes from the JWT and `status` is server-owned, so neither is
 * accepted here.
 */
export class CreateRideDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  fromLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  fromLng?: number;

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  toLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  toLng?: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsEnum(USER_ROLE)
  role: USER_ROLE;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedTimeOfArrival?: number;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

/** Query parameters for the public ride listing. */
export class ListRidesQueryDto {
  @IsOptional()
  @IsEnum(USER_ROLE)
  role?: USER_ROLE;
}

/** Query parameters for the matching endpoint. */
export class MatchRidesQueryDto {
  // Query strings need an explicit conversion: implicit coercion is disabled
  // globally so that request bodies keep their declared types.
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  fromLat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  fromLng: number;

  @IsDateString()
  timestamp: string;

  @IsEnum(USER_ROLE)
  role: USER_ROLE;
}
