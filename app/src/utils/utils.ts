import { RideFormData, RideParticipant } from '../interfaces/types';
import {
  USER_ROLE,
  SCORE_CONFIG,
  FEEDBACK_EMOJI,
  FEEDBACK_EMOJI_CHARS,
  FEEDBACK_EMOJI_LABELS,
} from '../constants/enums';

/**
 * The subset of a ride needed to work out who the other party is.
 * Accepts both RideFormData and RideHistory, whose id fields differ in type.
 */
interface CounterpartSource {
  role: string;
  riderId?: number | string | null;
  passengerId?: number | string | null;
  createdBy?: number | string | null;
  rider?: RideParticipant | null;
  passengers?: RideParticipant[] | null;
}

/** Ids arrive as number or string depending on the endpoint. */
const sameId = (
  a: number | string | null | undefined,
  b: number | string | null | undefined,
): boolean => a !== null && a !== undefined && String(a) === String(b);

/**
 * Returns the other person in a ride, from the current user's point of view:
 * the passenger if you are the rider, the rider if you are the passenger.
 *
 * This was previously reimplemented in five places -- identically in Dashboard
 * and MobileDashboard, and in a subtly reduced form in determineMatchedUser,
 * which omitted the creator fallback below and so returned null on rides the
 * dashboards resolved. One definition means the views cannot disagree.
 *
 * A ride carries only one passenger today; `passengers[0]` reflects that, and
 * is the assumption to revisit if group rides ever land.
 */
export const getRideCounterpart = (
  ride: CounterpartSource,
  currentUserId: number | null | undefined,
): RideParticipant | null => {
  if (currentUserId === null || currentUserId === undefined) return null;

  const firstPassenger = ride.passengers?.[0] ?? null;

  if (sameId(ride.riderId, currentUserId) && firstPassenger) {
    return firstPassenger;
  }

  if (sameId(ride.passengerId, currentUserId) && ride.rider) {
    return ride.rider;
  }

  // The creator is neither rider nor passenger on some rides; fall back to
  // whichever side is opposite the role the ride was posted under.
  if (sameId(ride.createdBy, currentUserId)) {
    const postedAsRider =
      ride.role?.toLowerCase() === USER_ROLE.RIDER.toLowerCase();

    return postedAsRider ? firstPassenger : (ride.rider ?? null);
  }

  return null;
};

/** @deprecated Use {@link getRideCounterpart}. */
export const determineMatchedUser = (
  ride: RideFormData,
  currentUserId: number,
): RideParticipant | null => getRideCounterpart(ride, currentUserId);

/**
 * Maps an average score to the most appropriate emoji
 * Server calculates the score, frontend just maps it to emoji
 * @param averageScore - The average score (0-2 range where 0=best, 2=worst)
 * @returns The emoji character representing the average score
 */
export const getAverageScoreEmoji = (averageScore: number): string => {
  // Use centralized thresholds instead of hardcoded values
  if (averageScore <= SCORE_CONFIG.EMOJI_THRESHOLDS.SATISFIED_MAX) {
    return FEEDBACK_EMOJI_CHARS[FEEDBACK_EMOJI.SATISFIED];
  }
  if (averageScore <= SCORE_CONFIG.EMOJI_THRESHOLDS.NEUTRAL_MAX) {
    return FEEDBACK_EMOJI_CHARS[FEEDBACK_EMOJI.NEUTRAL];
  }

  return FEEDBACK_EMOJI_CHARS[FEEDBACK_EMOJI.DISSATISFIED];
};

/**
 * Gets all emoji characters except the one representing the average score
 * @param averageScore - The average score (0-2 range where 0=best, 2=worst)
 * @returns Array of emoji characters excluding the average score emoji
 */
export const getRemainingEmojis = (averageScore: number): string[] => {
  const averageEmoji = getAverageScoreEmoji(averageScore);
  return Object.values(FEEDBACK_EMOJI_CHARS).filter(
    (emoji) => emoji !== averageEmoji,
  );
};

/**
 * Simple score descriptors based on the three emoji categories
 * Uses centralized enum labels instead of hardcoded strings
 * @param averageScore - The average score (0-2 range where 0=best, 2=worst)
 * @returns Description matching the three emoji types from enum
 */
export const getScoreDescription = (averageScore: number): string => {
  // Use centralized labels from enum instead of hardcoded strings
  if (averageScore <= SCORE_CONFIG.EMOJI_THRESHOLDS.SATISFIED_MAX) {
    return FEEDBACK_EMOJI_LABELS[FEEDBACK_EMOJI.SATISFIED];
  }
  if (averageScore <= SCORE_CONFIG.EMOJI_THRESHOLDS.NEUTRAL_MAX) {
    return FEEDBACK_EMOJI_LABELS[FEEDBACK_EMOJI.NEUTRAL];
  }

  return FEEDBACK_EMOJI_LABELS[FEEDBACK_EMOJI.DISSATISFIED];
};

/**
 * Creates an empty emoji breakdown object with all emoji types initialized to 0
 * @returns Object with keys for each emoji type (0, 1, 2) set to 0
 */
export const createEmptyEmojiBreakdown = (): { [key: number]: number } => {
  return {
    [FEEDBACK_EMOJI.SATISFIED]: 0,
    [FEEDBACK_EMOJI.NEUTRAL]: 0,
    [FEEDBACK_EMOJI.DISSATISFIED]: 0,
  };
};
