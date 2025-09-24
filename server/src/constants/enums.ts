/**
 * Enum representing user roles in the application.
 * Use this for type safety and to avoid hardcoded role strings.
 *
 * Example usage:
 *   role === USER_ROLE.RIDER
 */
export enum USER_ROLE {
  RIDER = 'rider',
  PASSENGER = 'passenger',
}

export const USER_ROLES = [USER_ROLE.RIDER, USER_ROLE.PASSENGER] as const;
export type UserRoleType = (typeof USER_ROLES)[number];

/**
 * Enum representing ride statuses in the application.
 * Use this for type safety and to avoid hardcoded status strings.
 *
 * Example usage:
 *   status === RideStatus.ACTIVE
 */
export enum RIDE_STATUS {
  ACTIVE = 'ACTIVE',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/**
 * Time window (in minutes) for ride matching (how far apart rides can be matched)
 */
export const RIDE_MATCH_WINDOW_MINUTES = 5;

/**
 * Expiration window (in minutes) for how long a ride remains ACTIVE after its creation time
 */
export const RIDE_EXPIRATION_GRACE_MINUTES = 5;

/**
 * Enum representing feedback emoji types in the application.
 * Use this for type safety and to avoid hardcoded emoji strings.
 *
 * Values are stored as index-based integers for better database performance
 * and easier querying/sorting.
 */
export enum FEEDBACK_EMOJI {
  SATISFIED = 0, // 😊 - Satisfied
  NEUTRAL = 1, // 😐 - Neutral
  DISSATISFIED = 2, // 😠 - Dissatisfied/Not satisfied
}

/**
 * Feedback system points configuration
 */
export const FEEDBACK_POINTS = {
  BASE_POINTS: 20,
  BONUS_POINTS: {
    [FEEDBACK_EMOJI.SATISFIED]: 5,
    [FEEDBACK_EMOJI.NEUTRAL]: 2,
    [FEEDBACK_EMOJI.DISSATISFIED]: 0,
  },
} as const;
