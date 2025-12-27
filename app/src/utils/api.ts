import {
  API_AUTH_REFRESH,
  API_KARMA_REDEEM,
  API_KARMA_REWARDS,
  API_USER_AVERAGE_SCORE,
  API_KARMA_UPDATE_STATUS,
  API_USER_PEOPLE_IMPACTED,
  API_KARMA_USER_REDEMPTIONS,
} from '../constants/api';
import { ROUTE_LOGIN } from '../constants/routes';

import type {
  RewardResponse,
  AverageScoreResult,
  RedemptionResponse,
  UserRedemptionsResponse,
} from '../interfaces/types';

import { createEmptyEmojiBreakdown } from './utils';
import {
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  updateAccessToken,
  clearAuthData,
} from './auth';

let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token with Promise-based locking
 * Ensures only one refresh operation executes at a time, queuing subsequent calls
 * @returns New access token or null if refresh fails
 */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      console.error('No refresh token available');

      return null;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${API_AUTH_REFRESH}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        },
      );

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (data.accessToken) {
        updateAccessToken(data.accessToken);
        return data.accessToken;
      }

      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);

      clearAuthData();

      window.location.href = ROUTE_LOGIN;

      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Enhanced fetch wrapper with JWT authentication and automatic token refresh
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
  onAuthFailure?: () => void,
): Promise<T> {
  if (isAccessTokenExpired()) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      if (onAuthFailure) {
        onAuthFailure();
      } else {
        window.location.href = ROUTE_LOGIN;
      }

      throw new Error('Authentication expired. Please login again.');
    }
  }

  const accessToken = getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  });

  // Handle 401 Unauthorized - token might be invalid
  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({}));
        throw new Error(error.message || 'API Error');
      }

      return retryResponse.json();
    }

    clearAuthData();

    if (onAuthFailure) {
      onAuthFailure();
    } else {
      window.location.href = ROUTE_LOGIN;
    }

    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API Error');
  }

  return response.json();
}

/**
 * Helper function to build full API URL with parameter substitution
 * @param apiEndpoint - The API endpoint constant (e.g., API_USER_AVERAGE_SCORE)
 * @param params - Object containing parameter replacements (e.g., { userId: '123' })
 * @returns Full API URL ready for fetch
 */
function buildApiUrl(
  apiEndpoint: string,
  params: Record<string, string>,
): string {
  let url = apiEndpoint;

  // Replace all parameters in the endpoint (e.g., :userId -> actual ID)
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });

  return `${import.meta.env.VITE_API_BASE_URL}${url}`;
}

/**
 * Fetches the average score for a user from the server
 * @param userId - The user ID to fetch the score for
 * @returns Promise resolving to the average score result
 */
export const fetchUserAverageScore = async (
  userId: number,
): Promise<AverageScoreResult> => {
  try {
    const fullUrl = buildApiUrl(API_USER_AVERAGE_SCORE, {
      userId: userId.toString(),
    });
    const response = await apiFetch<AverageScoreResult>(fullUrl);
    return response;
  } catch (error) {
    console.error('Error fetching user average score:', error);

    return {
      averageScore: null,
      totalFeedback: 0,
      emojiBreakdown: createEmptyEmojiBreakdown(),
    };
  }
};

/**
 * Fetches people impacted data for a user (users they've ridden with and ride counts)
 * @param userId - The user ID to fetch people impacted data for
 * @returns Promise resolving to array of people with ride counts
 */
export const fetchPeopleImpacted = async (
  userId: number,
): Promise<{
  people: Array<{
    id: number;
    name: string;
    img: string;
    rideCount: number;
  }>;
  totalImpacted: number;
}> => {
  try {
    const fullUrl = buildApiUrl(API_USER_PEOPLE_IMPACTED, {
      userId: userId.toString(),
    });

    const response = await apiFetch<{
      people: Array<{
        id: number;
        name: string;
        img: string;
        rideCount: number;
      }>;
      totalImpacted: number;
    }>(fullUrl);

    return response;
  } catch (error) {
    console.error('Error fetching people impacted data:', error);

    // Return empty data as fallback
    return {
      people: [],
      totalImpacted: 0,
    };
  }
};

// Karma Redemption API Functions

/**
 * Get available rewards for redemption
 * @returns Promise resolving to available rewards
 */
export const getAvailableRewards = async (): Promise<{
  rewards: RewardResponse[];
}> => {
  const fullUrl = buildApiUrl(API_KARMA_REWARDS, {});
  return apiFetch(fullUrl);
};

/**
 * Redeem a reward for karma points
 * @param rewardId - The ID of the reward to redeem
 * @param rewardData - The reward data from frontend
 *
 * @returns Promise resolving to redemption response
 */
export const redeemReward = async (
  rewardId: string,
  rewardData: { name: string; points: number; description: string },
): Promise<RedemptionResponse> => {
  const fullUrl = buildApiUrl(API_KARMA_REDEEM, {});

  return apiFetch(fullUrl, {
    method: 'POST',
    body: JSON.stringify({
      rewardId,
      rewardName: rewardData.name,
      karmaPointsCost: rewardData.points,
      description: rewardData.description,
    }),
  });
};

/**
 * Get user's redemption history
 * @param userId - The user's ID
 * @returns Promise resolving to user's redemptions
 */
export const getUserRedemptions = async (
  userId: number,
): Promise<UserRedemptionsResponse> => {
  const fullUrl = buildApiUrl(API_KARMA_USER_REDEMPTIONS, {
    userId: userId.toString(),
  });
  return apiFetch(fullUrl);
};

/**
 * Update redemption status (for admin/merchant use)
 * @param redemptionCode - The redemption code
 * @param status - The new status
 * @returns Promise resolving to update confirmation
 */
export const updateRedemptionStatus = async (
  redemptionCode: string,
  status: string,
): Promise<{ message: string }> => {
  const fullUrl = buildApiUrl(API_KARMA_UPDATE_STATUS, { redemptionCode });

  return apiFetch(fullUrl, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};
