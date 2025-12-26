import React from 'react';

import { RIDE_STATUS, LEADERBOARD_RANK } from '../../constants/enums';
import { capitalize } from '../../utils/functions';

interface StatusBadgeProps {
  status?: RIDE_STATUS;
  rank?: LEADERBOARD_RANK;
  className?: string;
}

const rideStatusMap: Record<RIDE_STATUS, { color: string; text: string }> = {
  [RIDE_STATUS.IDLE]: {
    color:
      'border-slate-200 bg-gradient-to-br from-slate-100 via-white to-slate-50 text-slate-400',
    text: 'bg-slate-300',
  },
  [RIDE_STATUS.ACTIVE]: {
    color:
      'border-blue-300 bg-gradient-to-br from-blue-300 via-blue-50 to-blue-200 text-blue-600',
    text: 'bg-blue-600',
  },
  [RIDE_STATUS.CONFIRMED]: {
    color:
      'border-teal-300 bg-gradient-to-br from-teal-300 via-teal-50 to-teal-200 text-teal-600',
    text: 'bg-teal-600',
  },
  [RIDE_STATUS.REJECTED]: {
    color:
      'border-red-300 bg-gradient-to-br from-red-300 via-red-50 to-red-200 text-red-600',
    text: 'bg-red-600',
  },
  [RIDE_STATUS.EXPIRED]: {
    color:
      'border-gray-300 bg-gradient-to-br from-gray-300 via-gray-50 to-gray-200 text-gray-600',
    text: 'bg-gray-600',
  },
  [RIDE_STATUS.CANCELLED]: {
    color:
      'border-amber-300 bg-gradient-to-br from-amber-300 via-amber-50 to-amber-200 text-amber-600',
    text: 'bg-amber-600',
  },
  [RIDE_STATUS.COMPLETED]: {
    color:
      'border-green-300 bg-gradient-to-br from-green-300 via-green-50 to-green-200 text-green-600',
    text: 'bg-green-600',
  },
} as const;

const leaderboardRankMap: Record<
  LEADERBOARD_RANK,
  { color: string; text: string }
> = {
  [LEADERBOARD_RANK.GOLD]: {
    color:
      'border-yellow-300 bg-gradient-to-tr from-yellow-500 via-yellow-100 to-yellow-400 text-yellow-600',
    text: 'bg-yellow-600',
  },
  [LEADERBOARD_RANK.SILVER]: {
    color:
      'border-gray-300 bg-gradient-to-tr text-gray-600 from-gray-500 via-gray-200 to-gray-500 text-gray-500',
    text: 'bg-gray-500',
  },
  [LEADERBOARD_RANK.BRONZE]: {
    color:
      'border-amber-400 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 text-amber-800',
    text: 'bg-amber-800',
  },
} as const;

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  rank,
  className,
}) => {
  let s: { color: string; text: string } | undefined;
  let label: string;

  if (status) {
    s = rideStatusMap[status];
    label = capitalize(status);
  } else if (rank) {
    s = leaderboardRankMap[rank];
    label = rank;
  } else {
    return null;
  }

  if (!s) return null;

  return (
    <span
      className={`transition-150 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-normal hover:scale-110 ${s.color} ${className ?? ''}`}
    >
      <span className={`size-1.5 rounded-full ${s.text}`} />
      {label}
    </span>
  );
};

export default StatusBadge;
