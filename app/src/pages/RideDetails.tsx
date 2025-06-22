import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TbAlarm, TbCircleDashed, TbMapPin, TbMapSearch } from 'react-icons/tb';
import { formatFullDate } from '../utils/functions';
import { FaWalking } from 'react-icons/fa';
import { MdOutlineDirectionsBike } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { USER_ROLE } from '../constants/enums';

const RideDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showMap, setShowMap] = useState(false);

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const message = searchParams.get('message');
  const role = searchParams.get('role');
  const timestamp = searchParams.get('timestamp');

  const getDirectionsUrl = () => {
    if (!from || !to) return 'https://www.openstreetmap.org';
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(from)}%3B${encodeURIComponent(to)}`;
  };

  return (
    <main >
      <h1 className="mb-5 text-center text-xl font-semibold text-teal-500 md:text-2xl">
        Ride Details
      </h1>

      <div className="relative mx-auto max-w-4xl space-y-6 overflow-hidden rounded-xl border border-gray-200/80 bg-teal-50 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-light/40 dark:bg-transparent md:p-6">
        <div className="pointer-events-none absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-40 blur-[100px] dark:opacity-30" />
        <div className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px] dark:opacity-60" />
        <div>
          <p className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-teal-100 px-4 py-1 text-base font-medium text-teal-500 dark:bg-teal-900">
            {role === USER_ROLE.RIDER ? (
              <MdOutlineDirectionsBike />
            ) : (
              <FaWalking />
            )}
            {role === USER_ROLE.RIDER ? 'Rider' : 'Passenger'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <TbCircleDashed className="text-xl text-teal-500" />
            <div className="h-7 w-px border border-dashed border-teal-500"></div>
            <TbMapPin className="text-xl text-teal-500" />
          </div>
          <div className="flex-1 space-y-6">
            <p className="text-base font-normal text-dark dark:text-light">
              {from}
            </p>
            <p className="text-base font-normal text-dark dark:text-light">
              {to}
            </p>
          </div>
        </div>
        <div className="relative rounded-xl bg-teal-200 p-3 dark:bg-teal-500">
          <div className="absolute -top-2 right-5 size-0 origin-top rotate-90 scale-[2] border-l-[10px] border-r-[2px] border-t-[10px] border-l-transparent border-r-transparent border-t-teal-200 dark:border-t-teal-500"></div>
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <p className="pl-2 text-base font-normal text-dark">{message}</p>
            <p className="flex items-center justify-center gap-0.5 rounded-full bg-teal-50 px-3 py-1 text-base font-normal capitalize text-teal-500 shadow dark:bg-teal-900 dark:text-teal-50">
              <TbAlarm className="text-xl" />
              {timestamp ? formatFullDate(timestamp) : 'Just now'}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center gap-2 rounded-full bg-teal-100 px-6 py-3 text-sm font-medium transition-colors hover:bg-teal-200 dark:bg-teal-800 ${
              showMap
                ? 'text-teal-700 dark:text-teal-300'
                : 'text-teal-600 dark:text-teal-300'
            }`}
          >
            {showMap ? (
              <IoClose className="scale-110 text-xl" />
            ) : (
              <TbMapSearch className="text-xl" />
            )}
            {showMap ? 'Hide Route' : 'View Route'}
          </button>
          {showMap && (
            <>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200">
                <iframe
                  title="OpenStreetMap Directions"
                  src={getDirectionsUrl()}
                  width="100%"
                  height="500"
                  className="absolute inset-0"
                  allowFullScreen
                  loading="lazy"
                />
              </div>

              <p className="text-sm md:text-base">
                Having trouble with the map?{' '}
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-500 underline hover:text-teal-600 hover:no-underline"
                >
                  Open in new tab
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default RideDetails;
