// TODO: make common utils for Dashboard and MobileDashboard to avoid code duplication
import React from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

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
import UserDisplay from './ui/UserDisplay';
import StatusBadge from './ui/StatusBadge';

import { USER_ROLE, LS_RIDE_FORM_DATA_KEY } from '../constants/enums';
import { ROUTE_HOME, ROUTE_ROLE } from '../constants/routes';

import { RideHistory } from '../interfaces/types';

import {
  truncateText,
  getStoredUser,
  formatFullDate,
} from '../utils/functions';

interface MobileDashboardProps {
  rides: RideHistory[];
}

// Utility to get route for a given role
const getRoleRoute = (role: string | undefined) => {
  if (!role) {
    return ROUTE_HOME;
  }

  return ROUTE_ROLE.replace(':roleId', role.toLowerCase());
};

const MobileDashboard: React.FC<MobileDashboardProps> = ({ rides }) => {
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  /**
   * Determines which user to display based on the current user's role in the ride.
   * For riders: shows the passenger who matched with them
   * For passengers: shows the rider who matched with them
   */
  const getUserToDisplay = (ride: RideHistory) => {
    if (!currentUser) return null;

    const currentUserId = currentUser.id;

    // If current user is the rider, show the passenger
    if (
      ride.riderId === currentUserId &&
      ride.passengers &&
      ride.passengers.length > 0
    ) {
      return ride.passengers[0];
    }

    // If current user is the passenger, show the rider
    if (ride.passengerId === currentUserId && ride.rider) {
      return ride.rider;
    }

    // If current user is the creator but neither rider nor passenger (edge case),
    // show the opposite role based on the ride's role
    if (ride.createdBy === currentUserId) {
      if (
        ride.role.toLowerCase() === USER_ROLE.RIDER.toLowerCase() &&
        ride.passengers &&
        ride.passengers.length > 0
      ) {
        return ride.passengers[0];
      } else if (
        ride.role.toLowerCase() === USER_ROLE.PASSENGER.toLowerCase() &&
        ride.rider
      ) {
        return ride.rider;
      }
    }

    return null;
  };

  /**
   * Determines the label for the user section based on what type of users will be displayed.
   */
  const getUsersLabel = () => {
    if (!currentUser) return 'Match';

    if (currentUser.role.toLowerCase() === USER_ROLE.RIDER.toLowerCase()) {
      return USER_ROLE.PASSENGER;
    } else if (
      currentUser.role.toLowerCase() === USER_ROLE.PASSENGER.toLowerCase()
    ) {
      return USER_ROLE.RIDER;
    }

    return 'Match';
  };

  const handleRepeatRide = (ride: RideHistory) => {
    if (!currentUser || !currentUser.role) {
      console.error('User information is missing or incomplete.');
      toast.error('User information is missing. Please log in again.');
      return;
    }

    const userRole = currentUser.role as USER_ROLE;

    const rideData = {
      from: ride.from,
      to: ride.to,
      fromLat: ride.fromLat,
      fromLng: ride.fromLng,
      toLat: ride.toLat,
      toLng: ride.toLng,
      message: ride.message || '',
      role: userRole,
    };

    try {
      localStorage.setItem(LS_RIDE_FORM_DATA_KEY, JSON.stringify(rideData));
    } catch (err) {
      console.error('Failed to save ride data to localStorage:', err);
      toast.error(
        'Could not save ride data. Please check your browser storage settings.',
      );
      return;
    }

    navigate(getRoleRoute(userRole));
  };

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-teal-300 dark:border-teal-300/50">
      <h2 className="border-b border-teal-300/50 bg-teal-50 p-3 text-center dark:bg-teal-950">
        Ride History
      </h2>
      <div className="relative max-h-[60vh] min-h-64 overflow-y-auto overflow-x-hidden bg-transparent">
        <div className="pointer-events-none fixed -left-[20%] top-1/3 -z-10 size-48 rounded-full bg-teal-300 blur-[80px]" />
        <div className="pointer-events-none fixed -right-10 bottom-1/4 -z-10 size-32 rounded-full bg-teal-300 blur-[80px]" />

        {rides.length === 0 ? (
          <NoRideFound
            title="No rides yet"
            message="You haven't posted or requested any rides. Start your journey by posting a new ride or joining one!"
          />
        ) : (
          rides.map((ride: RideHistory, idx: number) => (
            <div
              key={ride.id}
              className={`relative z-20 flex flex-col gap-1 p-3 shadow-sm transition-shadow hover:shadow-md ${
                idx !== rides.length - 1 ? 'border-b border-teal-300/60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-200">
                  #{idx + 1}
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-full border border-teal-300 bg-gradient-to-tr from-teal-200 via-teal-100 to-teal-400 px-3 py-1 text-xs font-normal text-teal-700 shadow transition-all hover:scale-105 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-700 dark:bg-teal-900 dark:text-dark dark:hover:bg-teal-800"
                  onClick={() => handleRepeatRide(ride)}
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
                    <p className="max-w-full truncate text-xs font-normal">
                      {truncateText(ride.from, 32)}
                    </p>
                  </Tooltip>
                  <div className="h-1 w-px"></div>

                  <Tooltip content={ride.to}>
                    <p className="max-w-full truncate text-xs font-normal">
                      {truncateText(ride.to, 32)}
                    </p>
                  </Tooltip>
                </div>
              </div>
              {/* Message bubble */}
              <div className="relative mt-1 rounded-xl bg-teal-200 p-3 dark:bg-teal-500">
                <div className="absolute -top-2 right-5 size-0 origin-top rotate-90 scale-[2] border-l-[10px] border-r-[2px] border-t-[10px] border-l-transparent border-r-transparent border-t-teal-200 dark:border-t-teal-500"></div>
                <div className="flex items-center justify-between gap-2">
                  <Tooltip content={ride.message || '-'}>
                    <p className="max-w-[90%] truncate text-xs font-normal text-dark">
                      {truncateText(ride.message || '-', 40)}
                    </p>
                  </Tooltip>
                  <span className="flex min-w-20 items-center justify-center gap-0.5 rounded-full bg-teal-50 px-2 py-1 text-xxs font-normal text-teal-500 shadow dark:bg-teal-900 dark:text-teal-100">
                    <TbAlarm className="text-sm" />
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
                <StatusBadge status={ride.status} className="ml-auto" />
              </div>
              {/* User Display (Rider/Passenger based on current user) */}
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TbUser className="text-xs text-teal-400" />
                  <span className="text-xs font-semibold capitalize text-teal-700 dark:text-teal-200">
                    {getUsersLabel()}:
                  </span>
                </div>
                <UserDisplay
                  user={getUserToDisplay(ride)}
                  showProfilePicture={true}
                  className="text-xs"
                />
              </div>
              {/* Distance */}
              <div className="mt-1 flex items-center gap-2">
                <TbRoute className="text-xs text-teal-400" />
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-200">
                  Distance (km):
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
