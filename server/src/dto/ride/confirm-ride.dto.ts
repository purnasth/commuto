import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Confirm Ride DTO - Input for confirming a ride match
 */
export class ConfirmRideDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  passengerId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  passengerRideId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  riderId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  riderRideId?: number;
}
