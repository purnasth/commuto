import React from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

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

import { USER_ROLE, LS_RIDE_FORM_DATA_KEY } from '../constants/enums';

import { ROUTE_HOME, ROUTE_ROLE } from '../constants/routes';

import { RideHistory } from '../interfaces/types';

import {
  truncateText,
  getStoredUser,
  formatFullDate,
  formatDayMonthWithWeekday,
} from '../utils/functions';

import Tooltip from './ui/Tooltip';
import UserDisplay from './ui/UserDisplay';
import NoRideFound from './ui/NoRideFound';
import StatusBadge from './ui/StatusBadge';
import MobileDashboard from './MobileDashboard';

interface DashboardProps {
  rides: RideHistory[];
}

// Utility to get route for a given role
const getRoleRoute = (role: string | undefined) => {
  if (!role) {
    return ROUTE_HOME;
  }

  return ROUTE_ROLE.replace(':roleId', role.toLowerCase());
};

const Dashboard: React.FC<DashboardProps> = ({ rides }) => {
  const navigate = useNavigate();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const currentUser = getStoredUser();

  if (isMobile) {
    return <MobileDashboard rides={rides} />;
  }

  /**
   * Determines which user to display in the table based on the current user's role in the ride.
   * For riders: shows the passenger who matched with them
   * For passengers: shows the rider who matched with them
   * Since there's only one passenger per ride (bike), we take the first passenger from the array.
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
      return ride.passengers[0]; // Since there's only one passenger per ride
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
   * Determines the column label based on what type of users will be displayed.
   * If current user is a rider, the column will show passengers.
   * If current user is a passenger, the column will show riders.
   */
  const getUsersColumnLabel = () => {
    if (!currentUser) return '';

    // The column should show what type of user will be displayed
    // If current user is a rider, we'll show passengers, and vice versa
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
            <th className="px-4 py-3 text-left font-semibold capitalize text-teal-700 dark:text-teal-200">
              <TbUser className="inline-block align-middle text-sm xl:text-base" />{' '}
              {getUsersColumnLabel()}
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
                  className="border-b transition-colors last:border-none hover:bg-teal-50 dark:border-teal-300/30 dark:hover:bg-teal-900"
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
                    <StatusBadge status={ride.status} />
                  </td>
                  <td className="px-4 py-3">
                    <UserDisplay
                      user={getUserToDisplay(ride)}
                      showProfilePicture={true}
                      className="max-w-40 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {ride.distance ? ride.distance.toFixed(1) : '-'}
                  </td>
                  <td className="py-3 pl-4">
                    <button
                      className="transition-150 inline-flex items-center gap-1 rounded-full border border-teal-300 bg-gradient-to-tr from-teal-200 via-teal-100 to-teal-400 px-2.5 py-1 text-xs font-normal text-teal-600 hover:scale-110 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-700 dark:bg-teal-900 dark:text-dark dark:hover:bg-teal-800"
                      onClick={() => handleRepeatRide(ride)}
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
