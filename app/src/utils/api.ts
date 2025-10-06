import {
  API_USER_LOGOUT,
  API_USER_DETAILS,
  API_KARMA_REDEEM,
  API_KARMA_REWARDS,
  API_USER_AVERAGE_SCORE,
  API_KARMA_UPDATE_STATUS,
  API_USER_PEOPLE_IMPACTED,
  API_KARMA_USER_REDEMPTIONS,
} from '../constants/api';

import {
  UserDetails,
  RewardResponse,
  AverageScoreResult,
  RedemptionResponse,
  UserRedemptionsResponse,
} from '../interfaces/types';

import { createEmptyEmojiBreakdown } from './utils';

export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

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

/**
 * Fetches user details from the server using email
 * @param email - The user's email address
 * @returns Promise resolving to user details
 */
export const getUserDetails = async (email: string) => {
  const fullUrl = buildApiUrl(API_USER_DETAILS, { email });

  return apiFetch<{ user: UserDetails }>(fullUrl);
};

/**
 * Calls the logout API for the user
 * @param email - The user's email address
 * @returns Promise resolving when logout is complete
 */
export const logoutUser = async (email: string) => {
  const fullUrl = buildApiUrl(API_USER_LOGOUT, {});

  return apiFetch(fullUrl, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
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
 * @param userId - The user's ID
 * @param rewardData - The reward data from frontend
 * @returns Promise resolving to redemption response
 */
export const redeemReward = async (
  rewardId: string,
  userId: number,
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
      userId,
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
