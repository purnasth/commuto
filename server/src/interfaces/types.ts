import { USER_ROLE, DISTANCE_TIER, FEEDBACK_EMOJI } from '../constants/enums';

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
  emoji: FEEDBACK_EMOJI;
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

/**
 * Distance threshold configuration
 */
export interface DistanceThreshold {
  readonly min: number;
  readonly max: number;
  readonly multiplier: number;
}

/**
 * Karma points system configuration
 */
export interface KarmaPointsConfig {
  readonly BASE_POINTS: number;
  readonly SENTIMENT_BONUS: Record<FEEDBACK_EMOJI, number>;
  readonly MAX_POINTS_CAP: number;
  readonly MIN_POINTS_FLOOR: number;
}

/**
 * Input for karma calculation
 */
export interface KarmaCalculationInput {
  distance: number | null;
  feedbackRating: FEEDBACK_EMOJI;
}

/**
 * Step-by-step calculation breakdown
 */
export interface KarmaCalculationBreakdown {
  /** Step 1: Base points */
  step1_base: number;
  /** Step 2: Points after distance multiplier */
  step2_afterDistance: number;
  /** Step 3: Points after sentiment bonus */
  step3_afterSentiment: number;
  /** Step 4: Final points after caps/floors */
  step4_final: number;
}

/**
 * Complete karma calculation result
 */
export interface KarmaCalculationResult {
  /** Final calculated karma points */
  totalPoints: number;
  /** Base points before any multipliers */
  basePoints: number;
  /** Distance-based multiplier applied */
  distanceMultiplier: number;
  /** Distance tier classification */
  distanceTier: DISTANCE_TIER;
  /** Sentiment bonus points added */
  sentimentBonus: number;
  /** Complete calculation formula for transparency */
  formula: string;
  /** Step-by-step calculation breakdown */
  breakdown: KarmaCalculationBreakdown;
}
