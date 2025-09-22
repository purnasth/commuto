import { API_USER_AVERAGE_SCORE } from '../constants/api';
import { AverageScoreResult } from '../interfaces/types';

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
 * Fetches the average score for a user from the server
 * @param userId - The user ID to fetch the score for
 * @returns Promise resolving to the average score result
 */
export const fetchUserAverageScore = async (
  userId: number,
): Promise<AverageScoreResult> => {
  try {
    const url = API_USER_AVERAGE_SCORE.replace(':userId', userId.toString());
    const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${url}`;

    const response = await apiFetch<AverageScoreResult>(fullUrl);
    return response;
  } catch (error) {
    console.error('Error fetching user average score:', error);

    return {
      averageScore: null,
      totalFeedback: 0,
      emojiBreakdown: {},
    };
  }
};
