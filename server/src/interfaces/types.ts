import { FEEDBACK_EMOJI, USER_ROLE } from '../constants/enums';

/**
 * DTO for ride creation and updates
 */
export interface RideDto {
  from: string;
  fromLat?: number;
  fromLng?: number;
  to: string;
  toLat?: number;
  toLng?: number;
  message?: string;
  role: USER_ROLE;
  createdBy: number;
  estimatedTimeOfArrival?: number;
  timestamp?: string;
  status?: string;
}

/**
 * Interface for emoji breakdown
 */
export interface EmojiBreakdown {
  [FEEDBACK_EMOJI.SATISFIED]: number;
  [FEEDBACK_EMOJI.NEUTRAL]: number;
  [FEEDBACK_EMOJI.DISSATISFIED]: number;
}

/**
 * Interface for average score calculation result
 */
export interface AverageScoreResult {
  averageScore: number | null;
  totalFeedback: number;
  emojiBreakdown: EmojiBreakdown;
}

/**
 * DTO for feedback submission
 */
export interface FeedbackDto {
  rideId: number;
  fromUserId: number;
  toUserId: number;
  role: USER_ROLE;
  emoji: FEEDBACK_EMOJI; // 0=😊, 1=😐, 2=😠
  comment?: string;
}

/**
 * DTO for ride confirmation
 */
export interface ConfirmRideDto {
  passengerId?: number;
  passengerRideId?: number;
  riderId?: number;
  riderRideId?: number;
}

/**
 * Prisma feedback result type with proper typing
 */
export interface FeedbackRecord {
  id: number;
  rideId: number;
  fromUserId: number;
  toUserId: number;
  role: USER_ROLE;
  emoji: FEEDBACK_EMOJI;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
