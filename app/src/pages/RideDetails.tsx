import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  MdEmail,
  MdVerified,
  MdLocalPhone,
  MdOutlineDirectionsBike,
} from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { FaWalking } from 'react-icons/fa';
import { TbAlarm, TbCircleDashed, TbMapPin, TbMapSearch } from 'react-icons/tb';

import { RideFormData, UserDetails } from '../interfaces/types';

import { USER_ROLE } from '../constants/enums';
import { ROUTE_PROFILE } from '../constants/routes';

import { apiFetch } from '../utils/api';
import { useSocket } from '../utils/useSocket';
import { formatFullDate } from '../utils/functions';
import { determineMatchedUser } from '../utils/utils';

/**
 * Component to display matched user information
 */
const MatchedUserCard: React.FC<{ matchedUser: UserDetails }> = ({
  matchedUser,
}) => (
  <div className="!mt-0 space-y-3 rounded-xl border border-teal-200/50 bg-teal-50 p-4 shadow-sm dark:border-teal-300/30 dark:bg-teal-950">
    <h4 className="inline-flex w-fit items-center justify-center gap-2 text-lg font-medium capitalize text-teal-500 dark:text-teal-300">
      {matchedUser.role.toLowerCase() === USER_ROLE.RIDER ? (
        <MdOutlineDirectionsBike />
      ) : (
        <FaWalking />
      )}
      {matchedUser.role} details
    </h4>

    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-full bg-teal-200 dark:bg-teal-800">
          {matchedUser.profilePicture ? (
            <img
              src={matchedUser.profilePicture}
              alt={matchedUser.fullname}
              className="size-14 rounded-full border object-cover shadow-sm"
            />
          ) : (
            <TbCircleDashed className="text-2xl text-teal-600 dark:text-teal-300" />
          )}
        </div>
        <div>
          <h4 className="inline-flex items-center gap-1 text-base font-medium text-dark dark:text-light">
            {matchedUser.fullname}
            <MdVerified className="text-teal-500 dark:text-teal-300" />
          </h4>

          <p className="text-sm font-light">{matchedUser.address}</p>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Link
          to={`tel:${matchedUser.phone}`}
          className="transition-150 rounded-full border bg-green-600 px-6 py-2.5 text-lg text-green-50 transition hover:bg-green-400 hover:text-green-900 dark:bg-green-500 dark:text-green-950 dark:hover:bg-green-700 dark:hover:text-green-100"
        >
          <MdLocalPhone className="scale-125" />
          {/* {matchedUser.phone} */}
        </Link>
        <Link
          to={`mailto:${matchedUser.email}`}
          className="transition-150 rounded-full border bg-amber-400 px-6 py-2.5 text-lg text-amber-50 transition hover:bg-amber-200 hover:text-amber-600 dark:bg-amber-300 dark:text-amber-900 dark:hover:bg-amber-400 dark:hover:text-amber-950"
        >
          <MdEmail className="scale-125" />
          {/* {matchedUser.email} */}
        </Link>
      </div>
    </div>
  </div>
);

/**
 * Button component for completing a ride with proper role-based logic
 */
const CompleteRideButton: React.FC<{
  user: { id: number } | null;
  rideDetails: RideFormData;
  onComplete: (ride: RideFormData) => Promise<void>;
  onFeedback: () => void;
}> = ({ user, rideDetails, onComplete, onFeedback }) => {
  const isRider = Number(user?.id) === Number(rideDetails.riderId);

  const handleClick = async () => {
    if (isRider) {
      await onComplete(rideDetails);
      window.location.href = ROUTE_PROFILE;
    } else {
      onFeedback();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative overflow-hidden rounded-full border border-teal-200 bg-teal-400 px-7 py-3 text-sm text-light hover:bg-green-500 dark:text-dark"
    >
      <span className="absolute inset-0 z-0 animate-slide bg-gradient-to-r from-green-500 to-green-400 group-hover:animate-none"></span>
      <span className="relative z-10 font-medium tracking-wide">
        Complete the ride
      </span>
    </button>
  );
};

const RideDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showMap, setShowMap] = useState(false);
  const { showFeedbackPopup, setShowFeedbackPopup } = useSocket();
  const [user, setUser] = useState<{ id: number } | null>(null);
  const [matchedUser, setMatchedUser] = useState<UserDetails | null>(null);
  // const from = searchParams.get('from');
  // const to = searchParams.get('to');
  // const message = searchParams.get('message');
  // const role = searchParams.get('role');
  // const timestamp = searchParams.get('timestamp');

  const [rideDetails, setRideDetails] = useState(() => {
    const savedRide = localStorage.getItem('activeRide');
    return savedRide ? JSON.parse(savedRide) : {};
  });

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    setRideDetails(params);
    localStorage.setItem('activeRide', JSON.stringify(params));
  }, [searchParams]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  // Fetch full ride details with matched user information
  useEffect(() => {
    const fetchRideDetails = async () => {
      if (!rideDetails.id || !user?.id) return;

      try {
        const response = await apiFetch<{ ride: RideFormData }>(
          `${import.meta.env.VITE_API_BASE_URL}/rides/${rideDetails.id}?userId=${user.id}`,
        );

        const ride = response.ride;
        const matchedUser = determineMatchedUser(ride, user.id);
        setMatchedUser(matchedUser);
      } catch (error) {
        console.error('Error fetching ride details:', error);
      }
    };

    fetchRideDetails();
  }, [rideDetails.id, user?.id]);

  const from = rideDetails.from;
  const to = rideDetails.to;
  const message = rideDetails.message;
  const role = rideDetails.role;
  const timestamp = rideDetails.timestamp;

  const getDirectionsUrl = () => {
    if (!rideDetails.from || !rideDetails.to) {
      return 'https://www.openstreetmap.org';
    }
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(rideDetails.from)}%3B${encodeURIComponent(rideDetails.to)}`;
  };

  const handleCompleteRide = async (ride: RideFormData) => {
    try {
      await apiFetch(
        `${import.meta.env.VITE_API_BASE_URL}/rides/${ride.id}/complete`,
        { method: 'POST' },
      );

      // Clean up local storage
      localStorage.removeItem('activeRide');
      localStorage.setItem('rideStatus', 'completed');
    } catch (error) {
      console.error('Error completing ride:', error);
    }
  };

  return (
    <>
      <main>
        <h1 className="mb-5 text-center text-xl font-semibold text-teal-500 md:text-2xl">
          Ride Details
        </h1>

        <div className="relative mx-auto max-w-4xl space-y-6 overflow-hidden rounded-xl border border-gray-200/80 bg-teal-50/50 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-light/40 dark:bg-transparent md:p-6">
          <div className="pointer-events-none absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-70 blur-[100px] dark:opacity-30" />
          <div className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-100 blur-[200px] dark:opacity-60" />

          {matchedUser && <MatchedUserCard matchedUser={matchedUser} />}

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
          {rideDetails.estimatedTimeOfArrival && (
            <div className="rounded-xl bg-teal-100 p-3 dark:bg-teal-900">
              <div className="flex items-center gap-2">
                {role === USER_ROLE.RIDER ? (
                  <MdOutlineDirectionsBike className="text-lg text-teal-500" />
                ) : (
                  <FaWalking className="text-lg text-teal-500" />
                )}
                <span className="text-base text-dark dark:text-light">
                  {role === USER_ROLE.RIDER
                    ? `Time to reach passenger's location (by bike)`
                    : `Rider's estimated arrival time (by bike)`}
                  : ~{rideDetails.estimatedTimeOfArrival} minutes
                </span>
                {rideDetails.distance && (
                  <span className="ml-2 text-sm text-teal-600 dark:text-teal-400">
                    ({rideDetails.distance.toFixed(1)} km from rider's location)
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center gap-2 rounded-full bg-teal-200 px-6 py-3 text-sm font-medium transition-colors hover:bg-teal-300 dark:bg-teal-800 ${
                  showMap
                    ? 'text-teal-700 hover:text-teal-50 dark:text-teal-300'
                    : 'text-teal-600 hover:text-teal-50 dark:text-teal-300'
                }`}
              >
                {showMap ? (
                  <IoClose className="scale-110 text-xl" />
                ) : (
                  <TbMapSearch className="text-xl" />
                )}
                {showMap ? 'Hide Route' : 'View Route'}
              </button>

              <CompleteRideButton
                user={user}
                rideDetails={rideDetails}
                onComplete={handleCompleteRide}
                onFeedback={() => setShowFeedbackPopup(true)}
              />
            </div>
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
      {showFeedbackPopup && (
        <FeedbackModal
          onClose={() => setShowFeedbackPopup(false)}
          handleCompleteRide={handleCompleteRide}
          rideDetails={rideDetails}
        />
      )}
    </>
  );
};

export default RideDetails;

interface FeedbackModalProps {
  onClose: () => void;
  handleCompleteRide: (ride: RideFormData) => Promise<void>;
  rideDetails: RideFormData;
}

const FeedbackModal = ({
  onClose,
  handleCompleteRide,
  rideDetails,
}: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    console.log('Feedback submitted:', { rating, comment });
    await handleCompleteRide(rideDetails);
    onClose();
    window.location.href = ROUTE_PROFILE;
  };

  return (
    <main className="fixed inset-0 z-50 flex size-full min-h-screen items-center justify-center bg-white">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-teal-300 p-10 shadow-lg">
        <div className="pointer-events-none absolute -left-[20%] top-1/2 -z-10 size-48 rounded-full bg-teal-300 blur-[80px]" />
        <div className="pointer-events-none absolute -right-10 -top-12 -z-10 size-40 rounded-full bg-teal-300 blur-[50px]" />
        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          Share Your Experience
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Your experience will not shown to the rider, but it impacts the
          overall ride quality.
        </p>

        <div className="mb-8">
          <p className="mb-2 text-sm text-gray-600">Select an emoji:</p>
          <div className="flex gap-2">
            {['😀', '😊', '😐', '😞', '😠'].map((emoji) => {
              const isSelected = rating === emoji.charCodeAt(0);
              return (
                <button
                  key={emoji}
                  onClick={() => setRating(emoji.charCodeAt(0))}
                  className={`flex aspect-square size-9 items-center justify-center rounded-full border text-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                    isSelected
                      ? 'border-teal-400/50 bg-teal-50 text-teal-400 shadow-lg'
                      : 'border-amber-400/50 bg-amber-50 text-amber-400'
                  }`}
                  aria-label={`Rate ${emoji}`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment (optional)"
          className="w-full rounded px-3 py-2 text-sm text-dark outline outline-teal-300/50 focus:outline-teal-300/80"
        />

        <div className="mt-6 flex justify-end gap-3">
          {/* <button
              onClick={onClose}
              className="rounded bg-gray-300 px-4 py-2 text-sm hover:bg-gray-400"
            >
              Cancel
            </button> */}
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className={`rounded-full px-6 py-2 text-sm text-dark transition-colors ${
              rating === 0
                ? 'cursor-not-allowed bg-teal-300'
                : 'bg-teal-400 hover:bg-teal-600'
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </main>
  );
};
