/**
 * Authentication-related constants
 */
export const AUTH_CONSTANTS = {
  /**
   * Number of salt rounds for bcrypt hashing
   */
  BCRYPT_SALT_ROUNDS: 10,

  /**
   * Refresh token expiration in days
   */
  REFRESH_TOKEN_EXPIRY_DAYS: 30,
} as const;
