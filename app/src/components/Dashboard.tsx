import {
  TbUser,
  TbAlarm,
  TbRoute,
  TbRepeat,
  TbMapPin,
  TbMessage,
  TbStatusChange,
} from 'react-icons/tb';
import { MdOutlineShareLocation } from 'react-icons/md';

import { RIDE_STATUS } from '../constants/enums';
import { RideHistory } from '../interfaces/types';

import {
  truncateText,
  formatFullDate,
  formatDayMonthWithWeekday,
} from '../utils/functions';

import Tooltip from './ui/Tooltip';
import NoRideFound from './ui/NoRideFound';
import MobileDashboard from './MobileDashboard';

interface DashboardProps {
  rides: RideHistory[];
}

const Dashboard: React.FC<DashboardProps> = ({ rides }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  if (isMobile) {
    return <MobileDashboard rides={rides} />;
  }
  return (
    <div className="mt-4 overflow-x-auto rounded-3xl border border-teal-300/60 bg-white shadow-lg dark:bg-dark">
      <table className="w-full text-xs xl:text-sm">
        <thead className="bg-teal-100 dark:bg-teal-900">
          <tr>
            <th className="py-3 pl-4 text-left font-semibold text-teal-700 dark:text-teal-200"></th>
            <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
              <TbMapPin className="inline-block align-middle text-sm xl:text-base" />{' '}
              From
            </th>
            <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
              <MdOutlineShareLocation className="inline-block align-middle text-sm xl:text-base" />{' '}
              To
            </th>
            <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
              <TbMessage className="inline-block align-middle text-sm xl:text-base" />{' '}
              Message
            </th>
            <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
              <TbAlarm className="inline-block align-middle text-sm xl:text-base" />{' '}
              Time
            </th>
            <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
              <TbStatusChange className="inline-block align-middle text-sm xl:text-base" />{' '}
              Status
            </th>
            <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
              <TbUser className="inline-block align-middle text-sm xl:text-base" />{' '}
              Passengers
            </th>
            <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
              <TbRoute className="inline-block align-middle text-sm xl:text-base" />{' '}
              Distance (km)
            </th>
            <th className="py-3 pl-4 text-left font-semibold text-teal-700 dark:text-teal-200">
              <TbRepeat className="inline-block align-middle text-sm xl:text-base" />{' '}
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {rides.length === 0 ? (
            <tr>
              <td colSpan={13}>
                <NoRideFound
                  title="No rides yet"
                  message="You haven't posted or requested any rides. Start your journey by posting a new ride or joining one!"
                />
              </td>
            </tr>
          ) : (
            rides.map((ride, idx) => {
              return (
                <tr
                  key={ride.id}
                  className="border-b transition-colors last:border-none hover:bg-teal-50 dark:hover:bg-teal-900"
                >
                  <td className="py-3 pl-4">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <Tooltip content={ride.from}>
                      {truncateText(ride.from, 24)}
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    <Tooltip content={ride.to}>
                      {truncateText(ride.to, 24)}
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    <Tooltip content={ride.message || '-'}>
                      {truncateText(ride.message || '-', 26)}
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    <Tooltip content={formatFullDate(ride.timestamp)}>
                      {formatDayMonthWithWeekday(ride.timestamp)}
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    {ride.status === RIDE_STATUS.ACTIVE && (
                      <span className="transition-150 inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-100 px-2.5 py-1 text-xs font-normal text-blue-600 hover:scale-110">
                        <span className="size-1.5 rounded-full bg-blue-600" />
                        Active
                      </span>
                    )}
                    {ride.status === RIDE_STATUS.CONFIRMED && (
                      <span className="transition-150 inline-flex items-center gap-1 rounded-full border border-teal-300 bg-teal-100 px-2.5 py-1 text-xs font-normal text-teal-600 hover:scale-110">
                        <span className="size-1.5 rounded-full bg-teal-600" />
                        Confirmed
                      </span>
                    )}
                    {ride.status === RIDE_STATUS.REJECTED && (
                      <span className="transition-150 inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2.5 py-1 text-xs font-normal text-red-600 hover:scale-110">
                        <span className="size-1.5 rounded-full bg-red-600" />
                        Rejected
                      </span>
                    )}
                    {ride.status === RIDE_STATUS.EXPIRED && (
                      <span className="transition-150 inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs font-normal text-gray-600 hover:scale-110">
                        <span className="size-1.5 rounded-full bg-gray-600" />
                        Expired
                      </span>
                    )}
                    {ride.status === RIDE_STATUS.CANCELLED && (
                      <span className="transition-150 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-normal text-amber-600 hover:scale-110">
                        <span className="size-1.5 rounded-full bg-amber-600" />
                        Cancelled
                      </span>
                    )}
                    {ride.status === RIDE_STATUS.COMPLETED && (
                      <span className="transition-150 inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-100 px-2.5 py-1 text-xs font-normal text-green-600 hover:scale-110">
                        <span className="size-1.5 rounded-full bg-green-600" />
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Tooltip
                      content={
                        ride.passengers && ride.passengers.length > 0
                          ? ride.passengers.map((p) => p.fullname).join(', ')
                          : '-'
                      }
                    >
                      {ride.passengers && ride.passengers.length > 0
                        ? truncateText(
                            ride.passengers.map((p) => p.fullname).join(', '),
                            18,
                          )
                        : '-'}
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    {ride.distance ? ride.distance.toFixed(1) : '-'}
                  </td>
                  <td className="py-3 pl-4">
                    <button
                      className="transition-150 inline-flex items-center gap-1 rounded-full border border-teal-300 bg-gradient-to-tr from-teal-200 via-teal-100 to-teal-400 px-2.5 py-1 text-xs font-normal text-teal-600 hover:scale-110 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-700 dark:bg-teal-900 dark:text-dark dark:hover:bg-teal-800"
                      // TODO: Implement repeat ride functionality
                      onClick={() => {}}
                    >
                      <TbRepeat className="inline-block align-middle text-sm xl:text-base" />
                      Repeat
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        {/* //TODO: add a pagination */}
      </table>
    </div>
  );
};

export default Dashboard;
