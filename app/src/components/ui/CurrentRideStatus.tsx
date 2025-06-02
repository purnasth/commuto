import React from 'react';
import { TbAlarm, TbCircleDashed, TbMapPin } from 'react-icons/tb';

interface CurrentRideStatusProps {
  details: {
    from: string;
    to: string;
    message: string;
    time?: string;
    role: 'rider' | 'passenger';
  };
  onSearchAgain: () => void;
  onCancelRide: () => void;
}

const CurrentRideStatus: React.FC<CurrentRideStatusProps> = ({
  details,
  onSearchAgain,
  onCancelRide,
}) => {
  return (
    <main className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-white p-0 dark:bg-dark sm:p-5">
      <div className="pointer-events-none absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-40 blur-[100px]" />
      <div className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px]" />
      <div className="relative size-full max-w-xl p-5 md:h-auto md:rounded-3xl">
        <h3 className="pb-3 text-base font-medium text-teal-500 dark:text-teal-300 md:text-lg">
          Current Ride Status (Pending)
        </h3>
        <div className="space-y-3 rounded-xl border bg-teal-100/60 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-teal-300/50 dark:bg-teal-950">
          {/* <p className="inline-flex w-fit items-center justify-center gap-1 rounded-full bg-teal-200 px-3 py-1 text-sm font-medium text-teal-600 dark:bg-teal-900">
              {details.role === 'rider' ? (
                <MdOutlineDirectionsBike />
              ) : (
                <FaWalking />
              )}
              {details.role === 'rider' ? 'Rider' : 'Passenger'}
            </p> */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <TbCircleDashed className="text-base text-teal-500" />
              <div className="h-4 w-px border border-dashed border-teal-500"></div>
              <TbMapPin className="text-base text-teal-500" />
            </div>
            <div className="flex-1 space-y-3 text-sm font-normal text-dark dark:text-light">
              <p>{details.from}</p>
              <p>{details.to}</p>
            </div>
          </div>
          <div className="relative rounded-xl bg-teal-200 p-3">
            <div className="absolute -top-2 right-5 size-0 origin-top rotate-90 scale-[2] border-l-[10px] border-r-[2px] border-t-[10px] border-l-transparent border-r-transparent border-t-teal-200"></div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-normal text-dark">{details.message}</p>
              <p className="flex min-w-24 items-center justify-center gap-0.5 rounded-full bg-teal-50 py-1 text-sm font-normal lowercase text-teal-500 shadow dark:bg-teal-950 dark:text-teal-300">
                <TbAlarm className="text-xl" />
                {details.time
                  ? new Date(details.time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Just now'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSearchAgain}
              className="transition-150 w-full rounded-lg border border-teal-300 bg-teal-600 px-4 py-2 text-sm font-medium tracking-wide text-light hover:border-teal-500 hover:bg-teal-500 hover:text-light dark:hover:bg-teal-500"
            >
              Request Again
            </button>
            <button
              type="button"
              onClick={onCancelRide}
              className="transition-150 w-full rounded-lg border border-red-500 bg-red-100 px-4 py-2 text-sm font-medium tracking-wide text-red-500 hover:border-red-500 hover:bg-red-500 hover:text-light dark:hover:bg-red-500"
            >
              Cancel Ride
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CurrentRideStatus;
