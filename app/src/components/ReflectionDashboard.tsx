import { FaAward } from 'react-icons/fa6';
import { Link } from 'react-router-dom';

import { ReflectionStats, RideHistory } from '../interfaces/types';
import { USER_ROLE } from '../constants/enums';
import { ROUTE_REDEEM, ROUTE_VIEW_SCORE } from '../constants/routes';

import UserCard from './UserCard';
import TitleBar from './ui/TitleBar';
import PeopleImpactedWithScore from './ui/PeopleImpactedWithScore';

import tree1 from '../assets/trees/1.webp';

interface ReflectionDashboardProps {
  stats: ReflectionStats;
  completedRides: RideHistory[];
  currentUserId: number;
  userRole: USER_ROLE;
}

const ReflectionDashboard = ({
  stats,
  currentUserId,
  userRole,
}: ReflectionDashboardProps) => {
  return (
    <div className="grid grid-cols-1 rounded-3xl border-t-0 shadow-sm dark:border-teal-300/50 md:border md:border-t-0 xl:grid-cols-3">
      <div className="col-span-1 space-y-3 overflow-hidden rounded-3xl rounded-b-none bg-teal-50 p-3 dark:bg-teal-900 md:space-y-4 md:p-4 xl:rounded-bl-3xl xl:rounded-br-none">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="relative flex flex-col items-center rounded-xl border border-green-300 bg-gradient-to-br from-green-200 via-green-300 to-green-400 p-4 text-center shadow dark:from-green-300 dark:via-green-400 dark:to-green-500 md:p-6">
            <span className="text-base font-semibold text-green-900 md:text-lg">
              Completed Ride
            </span>
            <h3 className="text-5xl font-extrabold text-green-800 drop-shadow">
              {stats.confirmedCount}
            </h3>
            <TitleBar
              content="Rides successfully completed"
              position="-top-2"
              color="green"
            />
          </div>

          <div className="relative flex flex-col items-center rounded-xl border border-teal-300 bg-gradient-to-br from-teal-200 via-teal-300 to-teal-400 p-4 text-center shadow dark:from-teal-300 dark:via-teal-400 dark:to-teal-500 md:p-6">
            <span className="text-base font-semibold text-teal-900 md:text-lg">
              {userRole === USER_ROLE.RIDER
                ? 'Rides Posted'
                : 'Rides Requested'}
            </span>
            <h3 className="text-5xl font-extrabold text-teal-800 drop-shadow">
              {stats.postedCount}
            </h3>
            <TitleBar
              content={
                userRole === USER_ROLE.RIDER
                  ? 'Total rides you have offered'
                  : 'Total rides you have requested'
              }
              position="-top-2"
              color="teal"
            />
          </div>
        </div>
        <div className="relative flex flex-col items-center rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-300 to-amber-100 p-4 shadow-lg dark:from-amber-400 dark:via-amber-100 dark:to-amber-200 md:p-6">
          <div className="relative mb-0 flex h-40 w-80 items-end justify-center md:mb-2">
            <svg
              width="320"
              height="160"
              viewBox="0 0 320 160"
              className="absolute left-0 top-0"
            >
              <path
                d="M40,148 A120,120 0 0,1 280,160"
                fill="none"
                stroke="#facc15"
                strokeWidth="36"
                strokeLinecap="round"
                opacity="0.3"
              />
              <path
                d="M40,160 A120,120 0 0,1 240,64"
                fill="none"
                stroke="#f59e42"
                strokeWidth="36"
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center">
              <span className="text-5xl font-extrabold text-amber-600">
                {userRole === USER_ROLE.RIDER
                  ? stats.karmaPoints
                  : stats.creditScore}
              </span>
              <p className="font-semibold text-amber-700">
                {userRole === USER_ROLE.RIDER ? 'Karma Points' : 'Credit Score'}
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-amber-900">
            {userRole === USER_ROLE.RIDER
              ? 'Karma Points are rewards you earn for sharing rides and helping others reduce their carbon footprint. The more you contribute, the more points you collect!'
              : 'Credit Score reflects your reliability as a passenger. Higher scores are earned through positive feedback from riders and responsible ride behavior.'}
          </p>

          <Link
            to={userRole === USER_ROLE.RIDER ? ROUTE_REDEEM : ROUTE_VIEW_SCORE}
            className="mt-5 block rounded-full border border-dark/20 bg-amber-400 px-8 py-2 text-center font-bold text-amber-900 shadow transition hover:bg-amber-500"
          >
            {userRole === USER_ROLE.RIDER ? 'Redeem' : 'View Score'}
          </Link>
          <TitleBar
            content={
              userRole === USER_ROLE.RIDER
                ? 'Redeem your Karma Points for exclusive rewards'
                : 'Build your reputation through positive ride experiences'
            }
            position="top-2"
            color="amber"
          />
        </div>

        <div className="relative flex w-full flex-col items-center rounded-2xl border border-sky-300 bg-gradient-to-br from-sky-200 to-blue-100 p-6 shadow-lg dark:from-sky-300 dark:to-blue-200">
          <p className="mb-2 text-center text-xs text-sky-900">
            {userRole === USER_ROLE.RIDER
              ? 'Total distance you have travelled by sharing rides. Every kilometer counts towards a greener planet!'
              : 'Total distance you have travelled as a passenger. Every shared ride helps reduce carbon emissions!'}
          </p>
          <div className="flex w-full flex-col items-center">
            <div className="mb-1 flex w-full items-center justify-between">
              <span className="text-xs font-semibold text-sky-700">0 km</span>
              <span className="text-xs font-semibold text-sky-700">
                {stats.distanceTravelled.toLocaleString()} km
              </span>
            </div>
            <div className="relative flex h-5 w-full items-center">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500" />
            </div>
          </div>

          <TitleBar
            content={
              userRole === USER_ROLE.RIDER
                ? 'Keep going! More distance, more impact.'
                : 'Every ride shared makes a difference!'
            }
            position="-bottom-2"
            color="sky"
          />
        </div>
      </div>
      <div className="col-span-1 rounded-b-3xl bg-none dark:bg-teal-900 md:rounded-b-none md:bg-teal-50 xl:rounded-t-3xl">
        <div className="relative flex items-center justify-center space-y-3 border border-x-0 border-t-0 border-teal-300/50 bg-teal-50 pb-4 pt-1 dark:bg-transparent md:dark:bg-teal-900 lg:bg-white xl:rounded-b-3xl xl:dark:bg-dark">
          {/* <PeopleAvatarGrid people={people} /> */}
          <PeopleImpactedWithScore userId={currentUserId} />
          <TitleBar
            // content={
            //   people.length > 0
            //     ? `${people.length} People Impacted`
            //     : 'People Impacted'
            // }
            content="People Impacted"
            position="-bottom-2"
            color="teal"
          />
        </div>
        <div className="m-0 mt-4 h-auto scale-[1] overflow-hidden rounded-3xl bg-white pb-4 shadow outline outline-1 outline-teal-300/50 dark:bg-teal-700 md:m-4 md:mt-8 md:pb-4 xl:scale-[1.06]">
          <UserCard />
        </div>
      </div>
      <div className="col-span-1 rounded-3xl rounded-t-none rounded-bl-3xl md:bg-teal-50 md:dark:bg-teal-900 xl:rounded-t-3xl xl:rounded-bl-none">
        <div className="relative mt-4 flex flex-col items-center rounded-3xl border border-green-200 bg-gradient-to-br from-green-200 via-green-100 to-green-300 p-0 shadow-lg dark:from-green-300 dark:via-green-200 dark:to-green-400 md:m-4">
          <svg
            className="absolute left-2 top-2 h-8 w-8 opacity-30"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M12 2C7 7 2 12 12 22C22 12 17 7 12 2Z" fill="#22c55e" />
          </svg>
          <svg
            className="absolute right-4 top-6 h-6 w-6 opacity-20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" fill="#4ade80" />
          </svg>
          <svg
            className="absolute bottom-4 left-8 h-5 w-5 opacity-20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <ellipse cx="12" cy="12" rx="10" ry="6" fill="#bbf7d0" />
          </svg>
          <div className="z-10 flex w-full flex-col items-center p-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl font-bold text-green-700">
                CO₂ Reduced
              </span>
            </div>
            <div className="relative flex items-center justify-center">
              <svg
                className="absolute -top-4 left-1/2 -translate-x-1/2"
                width="80"
                height="40"
                viewBox="0 0 80 40"
              >
                <path
                  d="M10 35 Q40 0 70 35"
                  stroke="#4ade80"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.5"
                />
              </svg>
              <span className="relative text-5xl font-extrabold text-green-700 drop-shadow">
                {stats.co2Reduced.toFixed(1)}
              </span>
              <span className="relative ml-2 text-2xl font-semibold text-green-700">
                kg
              </span>
            </div>
            <p className="mt-4 text-center text-xs text-green-900">
              {userRole === USER_ROLE.RIDER
                ? 'You have helped reduce carbon emissions by sharing rides. Thank you for your contribution to a cleaner environment!'
                : 'By choosing shared rides over individual transport, you have contributed to reducing carbon emissions. Every shared journey matters!'}
            </p>

            <TitleBar
              content={
                userRole === USER_ROLE.RIDER
                  ? 'Every ride you share makes the air cleaner!'
                  : 'Your choice to share rides helps the planet!'
              }
              position="-top-2"
              color="green"
            />
          </div>
        </div>

        <div>
          <img
            src={tree1}
            alt="Trees"
            className="pointer-events-none h-64 w-full scale-125 select-none object-contain md:h-72 md:scale-150"
            draggable="false"
          />
        </div>

        <div className="relative flex flex-col items-center rounded-3xl border border-amber-300 bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200 p-0 shadow-lg md:m-4">
          <svg
            className="absolute left-4 top-3 h-6 w-6 opacity-20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" fill="#fbbf24" />
          </svg>
          <svg
            className="absolute right-6 top-6 h-4 w-4 opacity-20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <rect x="6" y="6" width="12" height="12" rx="6" fill="#fde68a" />
          </svg>
          <svg
            className="absolute bottom-4 left-10 h-3 w-3 opacity-20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <polygon points="12,2 15,22 9,22" fill="#f59e42" />
          </svg>
          <div className="z-10 flex w-full flex-col items-center px-6 pb-6 pt-4">
            <span className="text-2xl font-extrabold text-amber-700">
              <FaAward className="mr-2 inline-block" />
              Thank You!
            </span>
            <p className="mt-1 text-center text-xs text-amber-900">
              {userRole === USER_ROLE.RIDER
                ? 'Your positive impact is making the world a better place. We appreciate your efforts in sharing rides and helping the community!'
                : 'Your participation in ridesharing is making a positive impact. Thank you for choosing sustainable transport and building community connections!'}
            </p>

            <TitleBar
              content={
                userRole === USER_ROLE.RIDER
                  ? 'Keep up the great work and collect more achievements!'
                  : 'Continue building your reputation and making a difference!'
              }
              position="-bottom-2"
              color="amber"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReflectionDashboard;
