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
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

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
 * Configuration for avatar grid display.
 * Use this constant to manage avatar grid settings in one place.
 */
export const AVATAR_GRID_CONFIG = {
  MAX_VISIBLE_SLOTS: 4,
  EMPTY_SLOT_MESSAGE: 'Ride more, impact more, unlock!',
  DEFAULT_AVATAR_URL,
} as const;
