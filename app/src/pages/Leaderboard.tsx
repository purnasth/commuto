// TODO: responsive and code quality improvements
// TODO: fetch real data from backend instead of using mock data
import React, { useEffect, useState } from 'react';

import {
  TbBike,
  TbGift,
  TbMessageCircleStar,
  TbCircleNumber1Filled,
  TbCircleNumber2Filled,
  TbCircleNumber3Filled,
} from 'react-icons/tb';
import { MdOutlineLeaderboard } from 'react-icons/md';

import { LeaderboardUser } from '../interfaces/types';
import { USER_ROLE, LEADERBOARD_RANK } from '../constants/enums';

import CtoUI from '../components/ui/CtoUI';
import StatusBadge from '../components/ui/StatusBadge';
import UserDisplay from '../components/ui/UserDisplay';
import LeaderboardFacts from '../components/ui/LeaderboardFacts';
import Podium from '../components/ui/Podium';

const MOCK_USERS = [
  {
    id: 1,
    name: 'John Doe',
    profilePicture:
      'https://avatars.githubusercontent.com/u/107195487?s=400&u=6120358cdcf760f65cfda7f81e982dfb1d8f7a27&v=4',
    role: USER_ROLE.RIDER,
    rides: 45,
    karma: 2450,
    feedback: 4.8,
  },
  {
    id: 2,
    name: 'Jane Smith',
    profilePicture:
      'https://avatars.githubusercontent.com/u/107195487?s=400&u=6120358cdcf760f65cfda7f81e982dfb1d8f7a27&v=4',
    role: USER_ROLE.RIDER,
    rides: 38,
    karma: 1950,
    feedback: 4.9,
  },
  {
    id: 3,
    name: 'Mike Johnson',
    profilePicture:
      'https://avatars.githubusercontent.com/u/107195487?s=400&u=6120358cdcf760f65cfda7f81e982dfb1d8f7a27&v=4',
    role: USER_ROLE.RIDER,
    rides: 32,
    karma: 2180,
    feedback: 4.6,
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    profilePicture:
      'https://avatars.githubusercontent.com/u/107195487?s=400&u=6120358cdcf760f65cfda7f81e982dfb1d8f7a27&v=4',
    role: USER_ROLE.RIDER,
    rides: 28,
    karma: 1820,
    feedback: 4.7,
  },
  {
    id: 5,
    name: 'David Brown',
    profilePicture:
      'https://avatars.githubusercontent.com/u/107195487?s=400&u=6120358cdcf760f65cfda7f81e982dfb1d8f7a27&v=4',
    role: USER_ROLE.RIDER,
    rides: 24,
    karma: 1650,
    feedback: 4.5,
  },
];

const Leaderboard: React.FC = () => {
  const [topRiders, setTopRiders] = useState<LeaderboardUser[]>([]);
  const [topKarmaPoints, setTopKarmaPoints] = useState<LeaderboardUser[]>([]);
  const [topFeedback, setTopFeedback] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rides' | 'karma' | 'feedback'>(
    'rides',
  );

  const getBadge = (rank: number): LEADERBOARD_RANK | undefined => {
    switch (rank) {
      case 1:
        return LEADERBOARD_RANK.GOLD;
      case 2:
        return LEADERBOARD_RANK.SILVER;
      case 3:
        return LEADERBOARD_RANK.BRONZE;
      default:
        return undefined;
    }
  };

  // Helper function to get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <TbCircleNumber1Filled className="size-6 rounded-full border border-yellow-600 bg-gradient-to-tr from-yellow-500 via-yellow-200 to-yellow-500 text-sm text-yellow-600" />
        );
      case 2:
        return (
          <TbCircleNumber2Filled className="size-6 rounded-full border border-gray-500 bg-gradient-to-tr from-gray-500 via-gray-200 to-gray-500 text-sm text-gray-500" />
        );
      case 3:
        return (
          <TbCircleNumber3Filled className="size-6 rounded-full border border-amber-700 bg-gradient-to-tr from-amber-700 via-amber-400 to-amber-700 text-sm text-amber-700" />
        );
      default:
        return <span>#{rank}</span>;
    }
  };

  useEffect(() => {
    // Rides leaderboard
    const riders = [...MOCK_USERS]
      .sort((a, b) => b.rides - a.rides)
      .map((user, idx) => ({
        id: user.id,
        name: user.name,
        profilePicture: user.profilePicture,
        role: user.role,
        value: user.rides,
        rank: idx + 1,
        badge: getBadge(idx + 1),
      }));
    setTopRiders(riders);

    // Karma leaderboard
    const karma = [...MOCK_USERS]
      .sort((a, b) => b.karma - a.karma)
      .map((user, idx) => ({
        id: user.id,
        name: user.name,
        profilePicture: user.profilePicture,
        role: user.role,
        value: user.karma,
        rank: idx + 1,
        badge: getBadge(idx + 1),
      }));
    setTopKarmaPoints(karma);

    // Feedback leaderboard
    const feedback = [...MOCK_USERS]
      .sort((a, b) => b.feedback - a.feedback)
      .map((user, idx) => ({
        id: user.id,
        name: user.name,
        profilePicture: user.profilePicture,
        role: user.role,
        value: user.feedback,
        rank: idx + 1,
        badge: getBadge(idx + 1),
      }));
    setTopFeedback(feedback);

    setLoading(false);
  }, []);

  const getCurrentLeaderboard = () => {
    switch (activeTab) {
      case 'rides':
        return topRiders;
      case 'karma':
        return topKarmaPoints;
      case 'feedback':
        return topFeedback;
      default:
        return topRiders;
    }
  };

  const getValueSuffix = () => {
    switch (activeTab) {
      case 'rides':
        return 'rides';
      case 'karma':
        return 'points';
      case 'feedback':
        return '/5';
      default:
        return 'rides';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {/* // TODO: loading state */}
      </div>
    );
  }

  return (
    <>
      <main>
        <div className="pointer-events-none absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-40 blur-[100px]" />
        <div className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px]" />

        <div className="container mb-24 flex size-full max-w-4xl flex-col items-center justify-center gap-4 text-center">
          <span className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-100 px-4 py-1 text-xs font-semibold uppercase text-teal-700 sm:text-sm md:text-base">
            <MdOutlineLeaderboard className="text-lg text-teal-700" />
            Community Champions
          </span>
          <h1 className="mt-4 text-2xl font-bold capitalize leading-snug text-teal-500 md:text-4xl md:leading-snug lg:text-5xl lg:leading-snug">
            Commuto Leaderboard
          </h1>
          <p className="max-w-2xl font-body text-xs sm:text-sm md:text-sm">
            Discover our top-performing riders who are making a difference in
            sustainable transportation. From the most active riders to those
            with the highest karma points and best feedback scores.
          </p>
        </div>

        {/* // TODO: on click of the button, scroll to top section of the header */}
        <header className="sticky top-2 z-50 mx-auto flex w-fit items-center justify-center gap-1.5 rounded-full border bg-white px-1.5 py-2 dark:border-teal-300/20 dark:bg-teal-300/20 md:p-2">
          <button
            onClick={() => setActiveTab('rides')}
            className={`transition-150 inline-flex items-center gap-1 rounded-full border border-teal-400 py-2.5 pl-4 pr-5 text-xs font-medium text-teal-700 dark:text-dark dark:hover:bg-teal-800 ${
              activeTab === 'rides'
                ? 'bg-gradient-to-tr from-teal-600 to-teal-500 text-white shadow-md'
                : 'bg-gradient-to-tr from-teal-200 via-teal-100 to-teal-400 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-300 dark:bg-teal-900'
            }`}
          >
            <TbBike className="text-base" />
            Most Rides
          </button>

          <button
            onClick={() => setActiveTab('karma')}
            className={`transition-150 inline-flex items-center gap-1 rounded-full border border-teal-400 py-2.5 pl-4 pr-5 text-xs font-medium text-teal-700 dark:text-dark dark:hover:bg-teal-800 ${
              activeTab === 'karma'
                ? 'bg-gradient-to-tr from-teal-600 to-teal-500 text-white shadow-md'
                : 'bg-gradient-to-tr from-teal-200 via-teal-100 to-teal-400 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-300 dark:bg-teal-900'
            }`}
          >
            <TbGift className="text-base" />
            Top Karma
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`transition-150 inline-flex items-center gap-1 rounded-full border border-teal-400 py-2.5 pl-4 pr-5 text-xs font-medium text-teal-700 dark:text-dark dark:hover:bg-teal-800 ${
              activeTab === 'feedback'
                ? 'bg-gradient-to-tr from-teal-600 to-teal-500 text-white shadow-md'
                : 'bg-gradient-to-tr from-teal-200 via-teal-100 to-teal-400 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-300 dark:bg-teal-900'
            }`}
          >
            <TbMessageCircleStar className="text-base" />
            Best Feedback
          </button>
        </header>

        <div className="container max-w-4xl">
          {/* Leaderboard Header */}
          <div className="mt-2 text-center">
            {/* <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 md:text-2xl">
              {getTabIcon()}
              {getTabTitle()}
            </h2> */}
            <p className="mx-auto max-w-md text-xs">
              {activeTab === 'rides' &&
                'Most active riders who have completed the highest number of rides on Commuto and contributed to sustainable transportation.'}
              {activeTab === 'karma' &&
                'Riders with the highest Karma Points earned through positive behavior, reliability, and community engagement.'}
              {activeTab === 'feedback' &&
                'Riders with the best average feedback scores from passengers, reflecting their trustworthiness and ride quality.'}
            </p>
          </div>

          <Podium
            getCurrentLeaderboard={getCurrentLeaderboard}
            getRankIcon={getRankIcon}
            getValueSuffix={getValueSuffix}
          />

          {/* Full Leaderboard List */}
          <div className="mt-12 space-y-3">
            <h3 className="text-center text-2xl font-semibold text-teal-500">
              {activeTab === 'rides' && 'Total Rides'}
              {activeTab === 'karma' && 'Karma Points'}
              {activeTab === 'feedback' && 'Feedback Score'} Leaderboard
            </h3>

            <div className="overflow-x-auto rounded-t-3xl border border-teal-300/60 bg-white shadow-lg dark:bg-dark">
              <table className="w-full text-xs xl:text-sm">
                <thead className="bg-teal-100 dark:bg-teal-900">
                  <tr>
                    <th className="py-3 pl-4 text-left font-semibold text-teal-700 dark:text-teal-200">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
                      Rider
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
                      {activeTab === 'rides' && 'Total Rides'}
                      {activeTab === 'karma' && 'Karma Points'}
                      {activeTab === 'feedback' && 'Feedback Score'}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
                      Badge
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentLeaderboard().map((user) => (
                    <tr
                      key={user.id}
                      className="border-b transition-colors last:border-none hover:bg-teal-50 dark:border-teal-300/30 dark:hover:bg-teal-900"
                    >
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(user.rank)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {/* <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {user.name}
                            </p>
                          </div>
                        </div> */}
                        <UserDisplay
                          user={{
                            id: user.id,
                            profilePicture: user.profilePicture,
                            email: `${user.name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                            fullname: user.name,
                          }}
                          showProfilePicture={true}
                          className="max-w-40 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-base font-semibold">
                            {activeTab === 'feedback'
                              ? user.value.toFixed(1)
                              : user.value.toLocaleString()}
                          </span>
                          <span className="text-xs">{getValueSuffix()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.badge && <StatusBadge rank={user.badge} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <LeaderboardFacts
            topRiders={topRiders}
            topKarmaPoints={topKarmaPoints}
            topFeedback={topFeedback}
          />
        </div>
      </main>
      <div className="my-32">
        <CtoUI
          title="Want to join the leaderboard?"
          description="Join the Commuto community today and start making an impact! By sharing rides, you get listed on our leaderboard, earn karma points, and contribute to a greener planet and a better world."
        />
      </div>
    </>
  );
};

export default Leaderboard;
