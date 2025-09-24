import {
  Min,
  Max,
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';

import { USER_ROLE, RIDE_STATUS } from '../constants/enums';

export class UpdateRideDto {
  @IsOptional()
  @IsString()
  from?: string;

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

  @IsOptional()
  @IsString()
  to?: string;

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

  @IsOptional()
  @IsEnum(USER_ROLE)
  role?: USER_ROLE;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedTimeOfArrival?: number;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsEnum(RIDE_STATUS)
  status?: RIDE_STATUS;
}
