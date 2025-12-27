/**
 * Authentication-related constants
 */
export const AUTH_CONSTANTS = {
  /**
   * Number of salt rounds for bcrypt hashing
   */
  BCRYPT_SALT_ROUNDS: 12,

  /**
   * Refresh token expiration in days.
   *
   * NOTE: This value must be kept in sync with the JWT refresh token
   *       expiration configured via the `JWT_REFRESH_EXPIRES_IN` environment
   *       variable (e.g. "30d"). If you change one, update the other as well.
   */
  REFRESH_TOKEN_EXPIRY_DAYS: 30,
} as const;
