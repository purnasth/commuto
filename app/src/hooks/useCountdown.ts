import { useEffect, useState } from 'react';

interface UseCountdownOptions {
  totalSeconds: number;
  onExpiry?: () => void;
  originalDuration?: number; // Original total duration from backend for progress calculation
}

export function useCountdown({
  totalSeconds,
  onExpiry,
  originalDuration,
}: UseCountdownOptions) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      if (onExpiry) {
        onExpiry();
      }
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const newValue = Math.max(prev - 1, 0);
        if (newValue === 0 && onExpiry) {
          // Call onExpiry when countdown reaches 0
          setTimeout(onExpiry, 100); // Small delay to ensure state update completes
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, onExpiry]);

  // Use originalDuration if provided, otherwise fall back to totalSeconds
  const duration = originalDuration || totalSeconds;
  // Progress calculation: how much time has elapsed (0 → 100)
  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  return { remaining, progress };
}
