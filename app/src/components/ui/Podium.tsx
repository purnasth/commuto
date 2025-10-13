import React from 'react';
import { LeaderboardUser } from '../../interfaces/types';
import Tooltip from './Tooltip';

interface PodiumProps {
  getCurrentLeaderboard: () => LeaderboardUser[];
  getRankIcon: (rank: number) => React.ReactNode;
  getValueSuffix: () => string;
}

const Podium = ({
  getCurrentLeaderboard,
  getRankIcon,
  getValueSuffix,
}: PodiumProps) => {
  return (
    <>
      <div className="mt-24 flex flex-wrap items-end justify-center gap-2">
        {getCurrentLeaderboard()
          .slice(0, 3)
          .map((user, index) => (
            <div
              key={user.id}
              className={`relative flex flex-col items-center ${
                index === 0
                  ? 'order-2 md:order-2'
                  : index === 1
                    ? 'order-1 md:order-1'
                    : 'order-3 md:order-3'
              }`}
            >
              <div
                className={`relative mb-4 flex w-48 flex-col items-center justify-end rounded-t-3xl bg-gradient-to-tr ${
                  index === 0
                    ? 'h-60 from-yellow-500 via-yellow-100 to-yellow-400'
                    : index === 1
                      ? 'h-44 from-gray-500 via-gray-200 to-gray-400'
                      : 'h-32 from-amber-700 via-amber-400 to-amber-600'
                }`}
              >
                <div
                  className={`absolute -top-8 flex scale-110 items-center justify-center overflow-hidden rounded-full border-4 text-xl font-bold text-white ${
                    index === 0
                      ? 'border-yellow-300 bg-yellow-500'
                      : index === 1
                        ? 'border-gray-400 bg-gray-500'
                        : 'border-amber-600 bg-amber-700'
                  }`}
                >
                  {/* {user.name.charAt(0)} */}
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="aspect-square size-16 rounded-full object-cover"
                  />
                </div>

                <div className="mb-3 flex flex-col items-center gap-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl">{getRankIcon(user.rank)}</span>

                    <Tooltip content={user.name}>
                      <h3 className="text-sm font-medium leading-[0] text-dark">
                        {user.name}
                      </h3>
                    </Tooltip>
                  </div>
                  <p className="rounded-full bg-white/50 px-2 py-0.5 text-xs font-normal backdrop-blur dark:bg-dark/50">
                    {user.value} {getValueSuffix()}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default Podium;
