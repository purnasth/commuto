import { useEffect, useState } from 'react';
import { getStoredUser, fetchUserCreditScore } from '../utils/functions';

export function useCreditScore() {
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const user = getStoredUser();

    if (user?.id) {
      fetchUserCreditScore(user.id)
        .then((score) => {
          if (!cancelled) {
            setCreditScore(score);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError('Failed to fetch credit score');
            setCreditScore(0);
            setLoading(false);
          }
        });
    } else {
      setCreditScore(0);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return { creditScore, loading, error };
}
