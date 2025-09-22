import { useEffect, useState, useCallback, useRef } from 'react';

interface UseCountdownOptions {
  totalSeconds: number;
  onExpiry?: () => void;
  originalDuration?: number;
  rideCreationTimestamp?: string;
}
export function useCountdown({
  totalSeconds,
  onExpiry,
  originalDuration,
  rideCreationTimestamp,
}: UseCountdownOptions) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expiryCalledRef = useRef(false);

  const calculateRealRemainingTime = useCallback(() => {
    if (!rideCreationTimestamp || !originalDuration) {
      return totalSeconds;
    }

    const rideCreatedAt = new Date(rideCreationTimestamp).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - rideCreatedAt) / 1000);
    const calculatedRemaining = Math.max(originalDuration - elapsedSeconds, 0);

    return calculatedRemaining;
  }, [rideCreationTimestamp, originalDuration, totalSeconds]);

  useEffect(() => {
    const realRemaining = calculateRealRemainingTime();
    setRemaining(realRemaining);
    expiryCalledRef.current = false; // Reset expiry flag if timer restarts
  }, [calculateRealRemainingTime]);

  useEffect(() => {
    if (remaining <= 0) {
      if (onExpiry && !expiryCalledRef.current) {
        expiryCalledRef.current = true;
        onExpiry();
      }
      return;
    }

    const interval = setInterval(() => {
      const realRemaining = calculateRealRemainingTime();
      setRemaining(realRemaining);

      if (realRemaining <= 0 && onExpiry && !expiryCalledRef.current) {
        expiryCalledRef.current = true;
        onExpiry();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, onExpiry, calculateRealRemainingTime]);

  const duration = originalDuration || totalSeconds;
  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  return { remaining, progress };
}
