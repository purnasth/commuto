import {
  Min,
  Max,
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

import { USER_ROLE } from '../../constants/enums';

/**
 * Create Ride DTO - Input for creating a new ride
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
