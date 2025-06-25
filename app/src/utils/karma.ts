import { apiFetch } from '../utils/api';

export async function fetchUserKarmaPoints(userId: number): Promise<number> {
  const res = await apiFetch<{ karmaPoints: number }>(
    `${import.meta.env.VITE_API_BASE_URL}/users/${userId}/karma-points`
  );
  return res.karmaPoints;
}
