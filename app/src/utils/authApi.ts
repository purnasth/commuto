/**
 * Authentication API Functions
 *
 * Handles all authentication-related API calls including login, signup, logout, and token refresh.
 */

import {
  API_AUTH_LOGIN,
  API_AUTH_SIGNUP,
  API_AUTH_LOGOUT,
  API_AUTH_REFRESH,
  API_AUTH_USER,
} from '../constants/api';

import type {
  LoginFormData,
  SignupFormData,
  AuthResponse,
  RefreshTokenResponse,
  UserDetails,
} from '../interfaces/types';

import { setAuthData, clearAuthData, getRefreshToken } from './auth';

import { apiFetch } from './api';

/**
 * Build full API URL
 */
function buildApiUrl(endpoint: string): string {
  return `${import.meta.env.VITE_API_BASE_URL}${endpoint}`;
}

/**
 * Login user with email and password
 * Stores tokens and user data on successful login
 * @param credentials - User email and password
 * @returns Promise resolving to authentication response
 */
export const loginUser = async (
  credentials: LoginFormData,
): Promise<AuthResponse> => {
  try {
    const response = await fetch(buildApiUrl(API_AUTH_LOGIN), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Login failed');
    }

    const data: AuthResponse = await response.json();

    // Store authentication data
    setAuthData(data);

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Signup new user
 * Stores tokens and user data on successful signup
 * @param userData - User registration data
 * @returns Promise resolving to authentication response
 */
export const signupUser = async (
  userData: SignupFormData,
): Promise<AuthResponse> => {
  try {
    const response = await fetch(buildApiUrl(API_AUTH_SIGNUP), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Signup failed');
    }

    const data: AuthResponse = await response.json();

    // Store authentication data
    setAuthData(data);

    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

/**
 * Logout user
 * Revokes refresh token on server and clears local auth data
 * @returns Promise resolving when logout is complete
 */
export const logoutUser = async (): Promise<void> => {
  try {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      await fetch(buildApiUrl(API_AUTH_LOGOUT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuthData();
  }
};

/**
 * Refresh access token using refresh token
 * @returns Promise resolving to new access token
 */
export const refreshToken = async (): Promise<RefreshTokenResponse> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(buildApiUrl(API_AUTH_REFRESH), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Token refresh failed');
    }

    return response.json();
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthData();
    throw error;
  }
};

/**
 * Get current authenticated user details
 * Fetches user details from the server using the JWT access token for authentication.
 * The server extracts user info from the JWT and returns the user object.
 *
 * @returns Promise resolving to user details
 */
export const getCurrentUser = async (): Promise<{ user: UserDetails }> => {
  return apiFetch<{ user: UserDetails }>(buildApiUrl(API_AUTH_USER));
};

/**
 * Check if user is authenticated
 * @returns True if user has valid authentication data
 */
export const checkAuthentication = (): boolean => {
  const refreshToken = getRefreshToken();
  return !!refreshToken;
};
