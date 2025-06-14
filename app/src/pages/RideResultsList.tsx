import React from 'react';
import { TbCircleDashed, TbMapPin, TbAlarm } from 'react-icons/tb';
import { RideFormData } from '../interfaces/types';
import { USER_ROLE } from '../constants/enums';

interface RideResultsListProps {
  ridesFound: RideFormData[];
  role: string;
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
    <div className="relative size-full max-w-xl p-5 md:h-auto md:rounded-3xl">
      <h3
        id="modal-title"
        className="pb-4 text-lg font-medium text-teal-500 dark:text-teal-300 md:text-xl"
      >
        Available {role === USER_ROLE.RIDER ? 'Passengers' : 'Rides'}
      </h3>
      <ul className="max-h-[90vh] space-y-3 overflow-y-auto md:max-h-[89vh]">
        {ridesFound.map((ride, index) => (
          <li
            key={index}
            className="space-y-3 rounded-xl border bg-teal-100/60 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-teal-300/50 dark:bg-teal-950"
          >
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
          </li>
        ))}
      </ul>
    </div>
  </main>
);

export default RideResultsList;
