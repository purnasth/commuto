import { useEffect, useState, useCallback } from 'react';

interface UseCountdownOptions {
  totalSeconds: number;
  onExpiry?: () => void;
  originalDuration?: number;
  rideTimestamp?: string;
}

export function useCountdown({
  totalSeconds,
  onExpiry,
  originalDuration,
  rideTimestamp,
}: UseCountdownOptions) {
  const [remaining, setRemaining] = useState(totalSeconds);

  const calculateRealRemainingTime = useCallback(() => {
    if (!rideTimestamp || !originalDuration) {
      return totalSeconds;
    }

    const rideCreatedAt = new Date(rideTimestamp).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - rideCreatedAt) / 1000);
    const calculatedRemaining = Math.max(originalDuration - elapsedSeconds, 0);

    return calculatedRemaining;
  }, [rideTimestamp, originalDuration, totalSeconds]);

  useEffect(() => {
    const realRemaining = calculateRealRemainingTime();
    setRemaining(realRemaining);
  }, [calculateRealRemainingTime]);

  useEffect(() => {
    if (remaining <= 0) {
      if (onExpiry) {
        onExpiry();
      }
      return;
    }

    const interval = setInterval(() => {
      const realRemaining = calculateRealRemainingTime();
      setRemaining(realRemaining);

      if (realRemaining <= 0 && onExpiry) {
        onExpiry();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, onExpiry, calculateRealRemainingTime]);

  const duration = originalDuration || totalSeconds;
  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  return { remaining, progress };
}
