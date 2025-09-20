import { useEffect, useState } from 'react';

interface UseCountdownOptions {
  totalSeconds: number;
}

export function useCountdown({ totalSeconds }: UseCountdownOptions) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining]);

  // Progress is how much time is left (100 → 0)
  const progress = (remaining / totalSeconds) * 100;

  return { remaining, progress };
}
