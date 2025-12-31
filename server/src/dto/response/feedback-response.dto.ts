import { Expose, Exclude } from 'class-transformer';

import { FEEDBACK_EMOJI, USER_ROLE } from '../../constants/enums';

/**
 * Feedback Response DTO - For feedback submission responses
 */
export class FeedbackResponseDto {
  @Expose()
  id: number;

  @Expose()
  rideId: number;

  @Expose()
  fromUserId: number;

  @Expose()
  toUserId: number;

  @Expose()
  role: USER_ROLE;

  @Expose()
  emoji: FEEDBACK_EMOJI;

  @Expose()
  comment?: string;

  @Expose()
  createdAt: Date;

  // Exclude internal fields
  @Exclude()
  updatedAt: Date;

  constructor(partial: Partial<FeedbackResponseDto>) {
    Object.assign(this, partial);
  }
}
