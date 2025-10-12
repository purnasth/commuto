// TODO: responsive

import React, { useEffect, useState } from 'react';
import {
  MdLeaderboard,
  MdEmojiEvents,
  MdWorkspacePremium,
  MdDirectionsCar,
} from 'react-icons/md';
import {
  TbBike,
  TbMedal,
  TbAward,
  TbUser,
  TbGift,
  TbCircleNumber1Filled,
  TbCircleNumber2Filled,
  TbCircleNumber3Filled,
  TbMessageCircleStar,
} from 'react-icons/tb';

import LoadingSpinner from '../components/ui/LoadingSpinner';

import { LeaderboardUser } from '../interfaces/types';
import { USER_ROLE } from '../constants/enums';
import CtoUI from '../components/ui/CtoUI';
import Tooltip from '../components/ui/Tooltip';
import StatusBadge from '../components/ui/StatusBadge';

const Leaderboard: React.FC = () => {
  const [topRiders, setTopRiders] = useState<LeaderboardUser[]>([]);
  const [topKarmaUsers, setTopKarmaUsers] = useState<LeaderboardUser[]>([]);
  const [topFeedbackUsers, setTopFeedbackUsers] = useState<LeaderboardUser[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rides' | 'karma' | 'feedback'>(
    'rides',
  );

  // Helper function to get badge based on rank
  const getBadge = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'Gold';
      case 2:
        return 'Silver';
      case 3:
        return 'Bronze';
      default:
        return '';
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
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);

        // Since there's no dedicated leaderboard API, we'll need to:
        // 1. Get all ride history data
        // 2. Process it to create leaderboards

        // For demo purposes, let's create some mock data based on the existing API structure
        // In a real implementation, you'd want to create backend endpoints for this

        const mockTopRiders: LeaderboardUser[] = [
          {
            id: 1,
            name: 'John Doe',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 45,
            rank: 1,
            badge: getBadge(1),
          },
          {
            id: 2,
            name: 'Jane Smith',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 38,
            rank: 2,
            badge: getBadge(2),
          },
          {
            id: 3,
            name: 'Mike Johnson',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 32,
            rank: 3,
            badge: getBadge(3),
          },
          {
            id: 4,
            name: 'Sarah Wilson',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 28,
            rank: 4,
            badge: getBadge(4),
          },
          {
            id: 5,
            name: 'David Brown',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 24,
            rank: 5,
            badge: getBadge(5),
          },
        ];

        const mockTopKarma: LeaderboardUser[] = [
          {
            id: 1,
            name: 'John Doe',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 2450,
            rank: 1,
            badge: getBadge(1),
          },
          {
            id: 3,
            name: 'Mike Johnson',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 2180,
            rank: 2,
            badge: getBadge(2),
          },
          {
            id: 2,
            name: 'Jane Smith',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 1950,
            rank: 3,
            badge: getBadge(3),
          },
          {
            id: 4,
            name: 'Sarah Wilson',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 1820,
            rank: 4,
            badge: getBadge(4),
          },
          {
            id: 5,
            name: 'David Brown',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 1650,
            rank: 5,
            badge: getBadge(5),
          },
        ];

        const mockTopFeedback: LeaderboardUser[] = [
          {
            id: 2,
            name: 'Jane Smith',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 4.9,
            rank: 1,
            badge: getBadge(1),
          },
          {
            id: 1,
            name: 'John Doe',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 4.8,
            rank: 2,
            badge: getBadge(2),
          },
          {
            id: 4,
            name: 'Sarah Wilson',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 4.7,
            rank: 3,
            badge: getBadge(3),
          },
          {
            id: 3,
            name: 'Mike Johnson',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 4.6,
            rank: 4,
            badge: getBadge(4),
          },
          {
            id: 5,
            name: 'David Brown',
            profilePicture: '',
            role: USER_ROLE.RIDER,
            value: 4.5,
            rank: 5,
            badge: getBadge(5),
          },
        ];

        setTopRiders(mockTopRiders);
        setTopKarmaUsers(mockTopKarma);
        setTopFeedbackUsers(mockTopFeedback);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const getCurrentLeaderboard = () => {
    switch (activeTab) {
      case 'rides':
        return topRiders;
      case 'karma':
        return topKarmaUsers;
      case 'feedback':
        return topFeedbackUsers;
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
        <div className="pointer-events-none absolute right-0 top-1/4 -z-10 contents size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px]" />

        <div className="container mb-24 flex size-full max-w-4xl flex-col items-center justify-center gap-4 text-center">
          <span className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-100 px-4 py-1 text-xs font-semibold uppercase text-teal-700 sm:text-sm md:text-base">
            <MdLeaderboard className="text-lg text-teal-700" />
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

          {/* Top 3 Podium */}
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
                  {/* Podium Step */}
                  <div
                    className={`relative mb-4 flex w-48 flex-col items-center justify-end rounded-t-3xl bg-gradient-to-tr ${
                      index === 0
                        ? 'h-60 from-yellow-500 via-yellow-100 to-yellow-400'
                        : index === 1
                          ? 'h-44 from-gray-500 via-gray-200 to-gray-400'
                          : 'h-32 from-amber-700 via-amber-400 to-amber-600'
                    }`}
                  >
                    {/* User Avatar */}
                    <div
                      className={`absolute -top-8 flex size-16 items-center justify-center rounded-full border-4 text-xl font-bold text-white ${
                        index === 0
                          ? 'border-yellow-300 bg-yellow-500'
                          : index === 1
                            ? 'border-gray-400 bg-gray-500'
                            : 'border-amber-600 bg-amber-700'
                      }`}
                    >
                      {user.name.charAt(0)}
                    </div>

                    <div className="mb-3 flex flex-col items-center gap-1">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-2xl">
                          {getRankIcon(user.rank)}
                        </span>

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
                      <TbAward className="inline-block align-middle text-sm xl:text-base" />{' '}
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
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {user.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
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
                {topKarmaUsers
                  .reduce((acc, user) => acc + user.value, 0)
                  .toLocaleString()}
              </div>
              <span className="text-xs">Total Karma Points Earned</span>
            </div>

            <div className="text-center">
              <div className="text-5xl font-bold text-teal-400">
                {(
                  topFeedbackUsers.reduce((acc, user) => acc + user.value, 0) /
                  topFeedbackUsers.length
                ).toFixed(1)}
              </div>
              <span className="text-xs">Average Feedback Score</span>
            </div>
          </div>
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
