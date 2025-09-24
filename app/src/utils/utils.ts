import { RideFormData, UserDetails } from '../interfaces/types';
import {
  SCORE_CONFIG,
  FEEDBACK_EMOJI,
  FEEDBACK_EMOJI_CHARS,
  FEEDBACK_EMOJI_LABELS,
} from '../constants/enums';

/**
 * Determines which user should be shown as the matched user based on the current user's role
 * @param ride - The complete ride data from the API
 * @param currentUserId - The ID of the currently logged-in user
 * @returns The matched user to display, or null if no match found
 */
export const determineMatchedUser = (
  ride: RideFormData,
  currentUserId: number,
): UserDetails | null => {
  const isRider = currentUserId.toString() === ride.riderId?.toString();
  const isPassenger = currentUserId.toString() === ride.passengerId?.toString();

  // If current user is the rider, show the passenger
  if (isRider && ride.passengers && ride.passengers.length > 0) {
    return ride.passengers[0]; // Return the first (and typically only) passenger
  }

  // If current user is the passenger, show the rider
  if (isPassenger && ride.rider) {
    return ride.rider;
  }

  return null;
};

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
