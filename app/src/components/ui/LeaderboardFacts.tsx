import React from 'react';
import { LeaderboardData } from '../../interfaces/types';

const LeaderboardFacts: React.FC<LeaderboardData> = ({
  topRiders,
  topKarmaPoints,
  topFeedback,
}) => {
  return (
    <>
      <div className="relative grid grid-cols-1 items-center gap-4 overflow-hidden rounded-b-3xl border border-t-0 border-teal-300/30 bg-gradient-to-br from-white via-teal-100 to-white p-12 shadow transition-all hover:border-teal-300 hover:shadow-sm dark:border-teal-300/30 dark:from-teal-950/20 dark:to-teal-700 dark:hover:border-teal-500 md:grid-cols-3">
        <div className="pointer-events-none absolute -bottom-1/2 -left-[0%] z-10 size-32 rounded-full bg-teal-300 blur-[50px]"></div>
        <div className="pointer-events-none absolute -right-0 -top-6 z-10 size-24 rounded-full bg-teal-300 blur-[50px]"></div>
        <div className="text-center">
          <div className="text-5xl font-bold text-teal-400">
            {topRiders.reduce((acc, user) => acc + user.value, 0)}
          </div>
          <span className="text-xs">Total Rides Completed</span>
        </div>

        <div className="text-center">
          <div className="text-5xl font-bold text-teal-400">
            {topKarmaPoints
              .reduce((acc, user) => acc + user.value, 0)
              .toLocaleString()}
          </div>
          <span className="text-xs">Total Karma Points Earned</span>
        </div>

        <div className="text-center">
          <div className="text-5xl font-bold text-teal-400">
            {(
              topFeedback.reduce((acc, user) => acc + user.value, 0) /
              topFeedback.length
            ).toFixed(1)}
          </div>
          <span className="text-xs">Average Feedback Score</span>
        </div>
      </div>
    </>
  );
};

export default LeaderboardFacts;
