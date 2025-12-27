/**
 * Authentication Constants
 *
 * Contains all authentication-related constants including storage keys,
 * token configuration, and authentication settings.
 */

// LocalStorage Keys
export const ACCESS_TOKEN_KEY = 'commuto_access_token';
export const REFRESH_TOKEN_KEY = 'commuto_refresh_token';
export const USER_DATA_KEY = 'commuto_user_data';

// Token Configuration
export const TOKEN_EXPIRY_BUFFER_SECONDS = 30; // Refresh token 30 seconds before expiration
export const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds
export const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

// Authentication Endpoints (for reference - actual endpoints in api.ts)
export const AUTH_LOGIN_PATH = '/login';
export const AUTH_SIGNUP_PATH = '/signup';
export const AUTH_DASHBOARD_PATH = '/dashboard';
