// TODO: equivalent compatibility with Dashboard.tsx

import React from 'react';
import {
  TbUser,
  TbAlarm,
  TbRoute,
  TbRepeat,
  TbMapPin,
  TbStatusChange,
  TbCircleDashed,
} from 'react-icons/tb';

import Tooltip from './ui/Tooltip';
import NoRideFound from './ui/NoRideFound';

import { RIDE_STATUS } from '../constants/enums';
import { RideHistory } from '../interfaces/types';

import { truncateText, formatFullDate } from '../utils/functions';

interface MobileDashboardProps {
  rides: RideHistory[];
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ rides }) => {
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-teal-300">
      <h2 className="border-b bg-teal-50 p-3 text-center">Ride History</h2>
      <div className="max-h-[60vh] min-h-64 overflow-y-auto">
        {rides.length === 0 ? (
          <NoRideFound
            title="No rides yet"
            message="You haven't posted or requested any rides. Start your journey by posting a new ride or joining one!"
          />
        ) : (
          rides.map((ride: RideHistory, idx: number) => (
            <div
              key={ride.id}
              className={`relative flex flex-col gap-1 bg-teal-50 p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-dark ${
                idx !== rides.length - 1 ? 'border-b border-teal-300/60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-200">
                  #{idx + 1}
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-full border border-teal-300 bg-gradient-to-tr from-teal-200 via-teal-100 to-teal-400 px-3 py-1 text-xs font-normal text-teal-700 shadow transition-all hover:scale-105 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-700 dark:bg-teal-900 dark:text-dark dark:hover:bg-teal-800"
                  // TODO: Implement repeat ride functionality
                  onClick={() => {}}
                >
                  <TbRepeat className="inline-block align-middle text-xs" />
                  Repeat
                </button>
              </div>
              {/* From/To visual path */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <TbCircleDashed className="text-base text-teal-500" />
                  <div className="h-4 w-px border border-dashed border-teal-500"></div>
                  <TbMapPin className="text-base text-green-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <Tooltip content={ride.from}>
                    <p className="max-w-full truncate text-xs font-normal text-dark">
                      {truncateText(ride.from, 32)}
                    </p>
                  </Tooltip>
                  <div className="h-1 w-px"></div>

                  <Tooltip content={ride.to}>
                    <p className="max-w-full truncate text-xs font-normal text-dark">
                      {truncateText(ride.to, 32)}
                    </p>
                  </Tooltip>
                </div>
              </div>
              {/* Message bubble */}
              <div className="relative mt-1 rounded-xl bg-teal-200 p-3">
                <div className="absolute -top-2 right-5 size-0 origin-top rotate-90 scale-[2] border-l-[10px] border-r-[2px] border-t-[10px] border-l-transparent border-r-transparent border-t-teal-200"></div>
                <div className="flex items-center justify-between gap-2">
                  <Tooltip content={ride.message || '-'}>
                    <p className="max-w-[70%] truncate text-xs font-normal text-dark">
                      {truncateText(ride.message || '-', 40)}
                    </p>
                  </Tooltip>
                  <span className="flex min-w-20 items-center justify-center gap-0.5 rounded-full bg-teal-50 px-2 py-1 text-xs font-normal text-teal-500 shadow">
                    <TbAlarm className="text-base" />
                    {formatFullDate(ride.timestamp)}
                  </span>
                </div>
              </div>
              {/* Status */}
              <div className="mt-1 flex items-center gap-2">
                <TbStatusChange className="text-xs text-teal-400" />
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-200">
                  Status:
                </span>
                <span className="ml-auto text-xs">
                  {ride.status === RIDE_STATUS.ACTIVE && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-100 px-2 py-0.5 text-xs font-normal text-blue-600">
                      <span className="size-1.5 rounded-full bg-blue-600" />
                      Active
                    </span>
                  )}
                  {ride.status === RIDE_STATUS.CONFIRMED && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-100 px-2 py-0.5 text-xs font-normal text-green-600">
                      <span className="size-1.5 rounded-full bg-green-600" />
                      Confirmed
                    </span>
                  )}
                  {ride.status === RIDE_STATUS.REJECTED && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-normal text-red-600">
                      <span className="size-1.5 rounded-full bg-red-600" />
                      Rejected
                    </span>
                  )}
                  {ride.status === RIDE_STATUS.EXPIRED && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600">
                      <span className="size-1.5 rounded-full bg-gray-600" />
                      Expired
                    </span>
                  )}
                  {ride.status === RIDE_STATUS.CANCELLED && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-600">
                      <span className="size-1.5 rounded-full bg-amber-600" />
                      Cancelled
                    </span>
                  )}
                </span>
              </div>
              {/* Passengers */}
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TbUser className="text-xs text-teal-400" />
                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-200">
                    Passengers:
                  </span>
                </div>
                <Tooltip
                  content={
                    ride.passengers && ride.passengers.length > 0
                      ? ride.passengers[0].fullname
                      : '-'
                  }
                >
                  <span className="flex items-end gap-1 truncate text-xs text-gray-800 dark:text-gray-100">
                    {ride.passengers && ride.passengers.length > 0
                      ? ride.passengers[0].fullname
                      : '-'}
                  </span>
                </Tooltip>
              </div>
              {/* Distance */}
              <div className="mt-1 flex items-center gap-2">
                <TbRoute className="text-xs text-teal-400" />
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-200">
                  Distance:
                </span>
                <span className="ml-auto text-xs text-gray-800 dark:text-gray-100">
                  {ride.distance ? ride.distance.toFixed(1) : '-'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileDashboard;
