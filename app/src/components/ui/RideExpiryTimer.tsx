import { useMemo } from 'react';
import { TbAlertCircle, TbRotateClockwise2 } from 'react-icons/tb';

import { useCountdown } from '../../hooks/useCountdown';

interface RideExpiryTimerProps {
  expiryTime: number;
  originalDuration?: number;
  onExpiry?: () => void;
  rideCreationTimestamp?: string;
}

export function RideExpiryTimer({
  expiryTime: totalSeconds,
  originalDuration,
  onExpiry,
  rideCreationTimestamp,
}: RideExpiryTimerProps) {
  const { remaining, progress } = useCountdown({
    totalSeconds,
    onExpiry,
    originalDuration,
    rideCreationTimestamp,
  });

  const progressGradient = useMemo(() => {
    const duration = originalDuration || totalSeconds;
    if (remaining > duration * (2 / 3)) return 'from-green-600 to-green-400';
    if (remaining > duration * (1 / 3)) return 'from-orange-400 to-orange-300';

    return 'from-red-600 to-red-400';
  }, [remaining, originalDuration, totalSeconds]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-2 pb-2">
      <div className="flex items-center justify-between text-sm">
        <p className="inline-flex items-center gap-1 font-normal">
          {remaining > 0 ? (
            <TbRotateClockwise2 className="text-lg text-teal-500" />
          ) : (
            <TbAlertCircle className="text-lg text-teal-500" />
          )}
          Your ride&nbsp;
          {remaining > 0 ? `will expire in:` : 'has been expired.'}
        </p>
        <strong className="font-bold">{formatTime(remaining)}</strong>
      </div>

      <div className="w-full overflow-hidden rounded-full bg-gradient-to-l from-gray-300 to-gray-200">
        <div
          className={`h-2 bg-gradient-to-r transition-[width] duration-1000 ease-linear ${progressGradient}`}
          style={{ width: `${100 - progress}%` }}
        />
      </div>
    </div>
  );
}
