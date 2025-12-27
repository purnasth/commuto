/**
 * Authentication & Token Management Utility
 *
 * Handles JWT token storage, retrieval, and validation for the Commuto app.
 * Provides secure token management with automatic expiration checking.
 */

import {
  USER_DATA_KEY,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXPIRY_BUFFER_SECONDS,
} from '../constants/auth';

import type {
  AuthTokens,
  AuthResponse,
  StoredUserData,
} from '../interfaces/types';

/**
 * Token Management Class
 * Provides methods for storing, retrieving, and managing JWT tokens
 */
class TokenManager {
  /**
   * Store authentication tokens in localStorage
   * @param tokens - Object containing accessToken and refreshToken
   */
  setTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Store user data in localStorage
   * @param userData - User information from authentication response
   */
  setUserData(userData: StoredUserData): void {
    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Store complete authentication response (tokens + user data)
   * @param authResponse - Complete authentication response from login/signup
   */
  setAuthData(authResponse: AuthResponse): void {
    this.setTokens({
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    });
    this.setUserData({
      id: authResponse.user.id,
      email: authResponse.user.email,
      fullname: authResponse.user.fullname,
      role: authResponse.user.role,
    });
  }

  /**
   * Get access token from localStorage
   * @returns Access token or null if not found
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token from localStorage
   * @returns Refresh token or null if not found
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  /**
   * Get stored user data from localStorage
   * @returns User data object or null if not found
   */
  getUserData(): StoredUserData | null {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  /**
   * Get all authentication data (tokens + user data)
   * @returns Object containing all auth data or null if incomplete
   */
  getAuthData(): (AuthTokens & { user: StoredUserData }) | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const user = this.getUserData();

    if (!accessToken || !refreshToken || !user) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  /**
   * Check if user is authenticated (has valid tokens)
   * @returns True if tokens exist, false otherwise
   */
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!(accessToken && refreshToken);
  }

  /**
   * Clear all authentication data from localStorage
   * Call this on logout or when tokens are invalid
   */
  clearAuthData(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Update only the access token (used after token refresh)
   * @param accessToken - New access token
   */
  updateAccessToken(accessToken: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } catch (error) {
      console.error('Error updating access token:', error);
      throw new Error('Failed to update access token');
    }
  }

  /**
   * Decode JWT token payload without verification
   * Useful for checking token expiration
   * @param token - JWT token string
   * @returns Decoded payload or null if invalid
   */
  decodeToken(
    token: string,
  ): (Record<string, unknown> & { exp?: number }) | null {
    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if access token is expired
   *
   * Uses a buffer time to proactively treat the token as expired slightly before its actual expiration.
   * This helps prevent requests from failing due to the token expiring during network transit or slow processing,
   * ensuring that the app can refresh the token in advance and avoid user-facing errors.
   *
   * @returns True if token is expired or within the buffer window, false otherwise
   */
  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();

    if (!token) {
      return true;
    }

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    // Proactively treat token as expired if it's within the buffer window
    // to avoid failures from expiration during network transit or slow requests.
    // By default, a 30-second buffer (configured via TOKEN_EXPIRY_BUFFER_SECONDS) provides
    // sufficient margin for typical API response times while minimizing unnecessary token refreshes.
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = TOKEN_EXPIRY_BUFFER_SECONDS * 1000;

    return currentTime >= expirationTime - bufferTime;
  }

  /**
   * Check if refresh token is expired
   * @returns True if token is expired or invalid, false otherwise
   */
  isRefreshTokenExpired(): boolean {
    const token = this.getRefreshToken();
    if (!token) {
      return true;
    }

    const decoded = this.decodeToken(token);

    if (!decoded || !decoded.exp) {
      return true;
    }

    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();

    return currentTime >= expirationTime;
  }

  /**
   * Get user ID from stored user data
   * @returns User ID or null if not found
   */
  getUserId(): number | null {
    const userData = this.getUserData();

    return userData?.id ?? null;
  }

  /**
   * Get user email from stored user data
   * @returns User email or null if not found
   */
  getUserEmail(): string | null {
    const userData = this.getUserData();

    return userData?.email ?? null;
  }

  /**
   * Get user full name from stored user data
   * @returns User full name or null if not found
   */
  getUserFullName(): string | null {
    const userData = this.getUserData();

    return userData?.fullname ?? null;
  }

  /**
   * Get user role from stored user data
   * @returns User role or null if not found
   */
  getUserRole(): string | null {
    const userData = this.getUserData();

    return userData?.role ?? null;
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Export convenience functions
export const setAuthData = (authResponse: AuthResponse) =>
  tokenManager.setAuthData(authResponse);

export const getAccessToken = () => tokenManager.getAccessToken();

export const getRefreshToken = () => tokenManager.getRefreshToken();

export const getUserData = () => tokenManager.getUserData();

export const getAuthData = () => tokenManager.getAuthData();

export const isAuthenticated = () => tokenManager.isAuthenticated();

export const clearAuthData = () => tokenManager.clearAuthData();

export const updateAccessToken = (token: string) =>
  tokenManager.updateAccessToken(token);

export const isAccessTokenExpired = () => tokenManager.isAccessTokenExpired();

export const isRefreshTokenExpired = () => tokenManager.isRefreshTokenExpired();

export const getUserId = () => tokenManager.getUserId();

export const getUserEmail = () => tokenManager.getUserEmail();

export const getUserFullName = () => tokenManager.getUserFullName();

export const getUserRole = () => tokenManager.getUserRole();
