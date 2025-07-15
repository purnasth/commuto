import { useEffect, useState } from 'react';
import { getStoredUser, fetchUserKarmaPoints } from '../utils/functions';

export function useKarmaPoints() {
  const [karmaPoints, setKarmaPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const user = getStoredUser();

    if (user?.id) {
      fetchUserKarmaPoints(user.id)
        .then((points) => {
          if (!cancelled) {
            setKarmaPoints(points);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError('Failed to fetch karma points');
            setKarmaPoints(0);
            setLoading(false);
          }
        });
    } else {
      setKarmaPoints(0);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return { karmaPoints, loading, error };
}
