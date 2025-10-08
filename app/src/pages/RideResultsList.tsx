import React from 'react';
import { TbCircleDashed, TbMapPin, TbAlarm } from 'react-icons/tb';
import {
  RideFormData as BaseRideFormData,
  UserDetails,
} from '../interfaces/types';
import { USER_ROLE } from '../constants/enums';

type RideFormData = BaseRideFormData & {
  createdByUser: UserDetails; // Always required - the person who created the ride
  rider?: UserDetails; // Optional - only for confirmed rides
  passengers?: UserDetails[]; // Optional - only for confirmed rides
};

interface RideResultsListProps {
  ridesFound: RideFormData[];
  role: USER_ROLE;
  handleConfirm: (ride: RideFormData) => void;
  handleReject: (ride: RideFormData) => void;
}

const RideResultsList: React.FC<RideResultsListProps> = ({
  ridesFound,
  role,
  handleConfirm,
  handleReject,
}) => (
  <main className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-white p-0 dark:bg-dark sm:p-5">
    <div className="pointer-events-none absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-40 blur-[100px]" />
    <div className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px]" />
    <div className="relative flex size-full max-w-xl flex-col justify-center p-5 md:h-auto md:rounded-3xl">
      <h3
        id="modal-title"
        className="pb-4 text-lg font-medium text-teal-500 dark:text-teal-300 md:text-xl"
      >
        Available {role === USER_ROLE.RIDER ? 'Passengers' : 'Rides'}{' '}
        {ridesFound.length === 0 ? '' : `(${ridesFound.length})`}
      </h3>

      <div className="max-h-[90vh] space-y-3 overflow-y-auto md:max-h-[89vh]">
        {ridesFound.map((ride, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border bg-teal-100/60 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-teal-300/50 dark:bg-teal-950"
          >
            <div className="flex items-center gap-3 border-b border-teal-200/50 pb-2.5 dark:border-teal-700/30">
              {(() => {
                // Use createdByUser to show the person who created/posted this ride
                const userToShow = ride.createdByUser!;

                return (
                  <>
                    <div className="flex size-10 items-center justify-center rounded-full bg-teal-200 dark:bg-teal-800">
                      {userToShow.profilePicture ? (
                        <img
                          src={userToShow.profilePicture}
                          alt={userToShow.fullname}
                          className="size-10 rounded-full border object-cover shadow-sm"
                        />
                      ) : (
                        <TbCircleDashed className="text-xl text-teal-600 dark:text-teal-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-dark dark:text-light">
                        {userToShow.fullname}
                      </p>
                      <p className="text-xs opacity-70">{userToShow.email}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <TbCircleDashed className="text-base text-teal-500" />
                <div className="h-4 w-px border border-dashed border-teal-500"></div>
                <TbMapPin className="text-base text-teal-500" />
              </div>
              <div className="flex-1 space-y-3 text-sm font-normal text-dark dark:text-light">
                <p>{ride.from}</p>
                <p>{ride.to}</p>
              </div>
            </div>
            <div className="relative rounded-xl bg-teal-200 p-3">
              <div className="absolute -top-2 right-5 size-0 origin-top rotate-90 scale-[2] border-l-[10px] border-r-[2px] border-t-[10px] border-l-transparent border-r-transparent border-t-teal-200"></div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-normal text-dark">{ride.message}</p>
                <p className="flex min-w-24 items-center justify-center gap-0.5 rounded-full bg-teal-50 py-1 text-sm font-normal lowercase text-teal-500 shadow dark:bg-teal-950 dark:text-teal-300">
                  <TbAlarm className="text-lg" />
                  {ride.timestamp
                    ? new Date(ride.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Invalid timestamp'}
                </p>
              </div>
            </div>

            {ride.distance !== undefined && (
              <div className="flex items-center justify-between gap-2 border-t border-teal-200/50 pt-2.5 dark:border-teal-700/30">
                {ride.distance === 0 ? (
                  <>
                    <span className="text-xs text-dark dark:text-light">
                      {role === USER_ROLE.RIDER
                        ? "You're at the passenger's location"
                        : 'Rider is at your location'}
                    </span>
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                      ({ride.distance.toFixed(1)} km)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-dark dark:text-light">
                      {role === USER_ROLE.RIDER
                        ? `Time to reach the location`
                        : `Rider will reach your location in`}{' '}
                      ~
                      <strong className="font-semibold">
                        {ride.estimatedTimeOfArrival}{' '}
                        {ride.estimatedTimeOfArrival === 1 ? 'min' : 'mins'}
                      </strong>
                    </span>
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                      ({ride.distance.toFixed(1)} km)
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleConfirm(ride)}
                className="group relative w-full overflow-hidden rounded-lg border border-teal-200 bg-teal-400 px-4 py-2 text-sm text-light hover:bg-green-500 dark:text-dark"
              >
                <span className="absolute inset-0 z-0 animate-slide bg-gradient-to-r from-green-500 to-green-400 group-hover:animate-none"></span>
                <span className="relative z-10 font-medium tracking-wide">
                  Confirm
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleReject(ride)}
                className="transition-150 w-full rounded-lg border border-teal-400 bg-teal-50 px-4 py-2 text-sm font-medium tracking-wide text-teal-500 hover:border-red-500 hover:bg-red-500 hover:text-light dark:bg-teal-900 dark:hover:bg-red-500"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </main>
);

export default RideResultsList;
