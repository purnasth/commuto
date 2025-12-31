import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { USER_ROLE, FEEDBACK_EMOJI } from '../../constants/enums';

/**
 * Create Feedback DTO - Input for submitting ride feedback
 * fromUserId comes from JWT authentication, not from request body
 */
export class CreateFeedbackDto {
  @IsInt()
  @Min(1)
  rideId: number;

  @IsInt()
  @Min(1)
  toUserId: number;

  @IsEnum(USER_ROLE)
  role: USER_ROLE;

  @IsEnum(FEEDBACK_EMOJI)
  emoji: FEEDBACK_EMOJI;

  @IsOptional()
  @IsString()
  comment?: string;
}
