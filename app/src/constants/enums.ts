import { DEFAULT_AVATAR_URL } from './app-assets';

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
 *   status === RIDE_STATUS.ACTIVE
 */
export enum RIDE_STATUS {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/**
 * Enum representing feedback emoji types in the application.
 * Use this for type safety and to avoid hardcoded emoji values.
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
 * Mapping of feedback emoji indices to actual emoji characters
 */
export const FEEDBACK_EMOJI_CHARS = {
  [FEEDBACK_EMOJI.SATISFIED]: '😊',
  [FEEDBACK_EMOJI.NEUTRAL]: '😐',
  [FEEDBACK_EMOJI.DISSATISFIED]: '😠',
} as const;

/**
 * Mapping of feedback emoji indices to their descriptive labels
 * Use these instead of hardcoded strings for consistency
 */
export const FEEDBACK_EMOJI_LABELS = {
  [FEEDBACK_EMOJI.SATISFIED]: 'Satisfied',
  [FEEDBACK_EMOJI.NEUTRAL]: 'Neutral',
  [FEEDBACK_EMOJI.DISSATISFIED]: 'Dissatisfied',
} as const;

/**
 * Pre-computed emoji options for UI components.
 * Avoids runtime enum processing and reverse mapping filtering issues.
 * Use this instead of processing FEEDBACK_EMOJI enum at runtime.
 */
export const EMOJI_OPTIONS = [
  {
    value: FEEDBACK_EMOJI.SATISFIED,
    char: FEEDBACK_EMOJI_CHARS[FEEDBACK_EMOJI.SATISFIED],
    label: FEEDBACK_EMOJI_LABELS[FEEDBACK_EMOJI.SATISFIED],
  },
  {
    value: FEEDBACK_EMOJI.NEUTRAL,
    char: FEEDBACK_EMOJI_CHARS[FEEDBACK_EMOJI.NEUTRAL],
    label: FEEDBACK_EMOJI_LABELS[FEEDBACK_EMOJI.NEUTRAL],
  },
  {
    value: FEEDBACK_EMOJI.DISSATISFIED,
    char: FEEDBACK_EMOJI_CHARS[FEEDBACK_EMOJI.DISSATISFIED],
    label: FEEDBACK_EMOJI_LABELS[FEEDBACK_EMOJI.DISSATISFIED],
  },
] as const;

/**
 * Key for storing and retrieving karma points from localStorage
 */
export const KARMA = 'karma';

/**
 * LocalStorage key for storing ride form data.
 * Use this constant throughout the app to avoid magic strings and typos.
 *
 * Example usage:
 *   localStorage.setItem(LS_RIDE_FORM_DATA_KEY, JSON.stringify(data));
 *   const data = localStorage.getItem(LS_RIDE_FORM_DATA_KEY);
 *
 * TODO: Refactor all usages of the string 'rideFormData' in the codebase to use this centralized key (LS_RIDE_FORM_DATA_KEY) for consistency and maintainability.
 */
export const LS_RIDE_FORM_DATA_KEY = 'rideFormData';

/**
 * Custom event names used throughout the application.
 * Use these constants to avoid hardcoded event strings and typos.
 * 
 * Example usage:
 *   window.addEventListener(CUSTOM_EVENTS.RIDE_STATUS_CHANGED, handler);
 *   window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.RIDE_STATUS_CHANGED, { detail: { status } }));
 */
export const CUSTOM_EVENTS = {
  RIDE_STATUS_CHANGED: 'rideStatusChanged',
} as const;

/**
 * Configuration for avatar grid display.
 * Use this constant to manage avatar grid settings in one place.
 */
export const AVATAR_GRID_CONFIG = {
  MAX_VISIBLE_SLOTS: 4,
  EMPTY_SLOT_MESSAGE: 'Ride more, impact more, unlock!',
  DEFAULT_AVATAR_URL,
} as const;

/**
 * Configuration for score display
 */
export const SCORE_CONFIG = {
  // Divide 0-2 score range into thirds for 3 emoji categories
  EMOJI_THRESHOLDS: {
    SATISFIED_MAX: 0.67, // 0.0 - 0.67 = 😊 Satisfied
    NEUTRAL_MAX: 1.33, // 0.68 - 1.33 = 😐 Neutral
    // 1.34 - 2.0 = 😠 Dissatisfied
  },
} as const;

/**
 * Configuration constants for ride completion locking mechanism
 *
 * How long to wait before considering a completion lock stale and automatically clearing it.
 * This prevents permanent deadlocks if a completion process fails unexpectedly.
 */
export const COMPLETION_LOCK_TIMEOUT_MS = 30000; // 30 seconds

/** 
 * Enum representing leaderboard ranks.
 */
export enum LEADERBOARD_RANK {
  GOLD = 'Gold',
  SILVER = 'Silver',
  BRONZE = 'Bronze',
}
