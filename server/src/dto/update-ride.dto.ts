import {
  Min,
  Max,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';

/**
 * Fields the owner of a ride may edit while it is still theirs to edit.
 *
 * `status` and `role` are deliberately excluded. Status transitions happen
 * through the dedicated confirm/complete/cancel/reject endpoints, which check
 * who is asking and apply the matching side effects; allowing a status here
 * would let an owner mark a ride COMPLETED and farm karma without a ride.
 * The relational columns (riderId, passengerId, createdBy, matchGroupId) and
 * the derived statistics (distance, co2Saved, peopleImpacted) are server-owned
 * for the same reason.
 */
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
  @IsNumber()
  @Min(0)
  estimatedTimeOfArrival?: number;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
