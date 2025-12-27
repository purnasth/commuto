import { toast } from 'react-toastify';
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
import {
  TbAlarm,
  TbMapPin,
  TbMapSearch,
  TbCircleDashed,
  TbInfoCircleFilled,
} from 'react-icons/tb';

import {
  UserDetails,
  RideFormData,
  RideStatusChangedEventDetail,
} from '../interfaces/types';

import { CUSTOM_EVENTS, RIDE_STATUS, USER_ROLE } from '../constants/enums';

import { apiFetch } from '../utils/api';
import { getUserData } from '../utils/auth';
import { useSocket } from '../utils/useSocket';
import { determineMatchedUser } from '../utils/utils';
import { dispatchRideStatusChanged } from '../utils/customEvents';
import { formatFullDate, getFeedbackKey } from '../utils/functions';

import FeedbackModal from '../components/FeedbackModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

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

    <div className="flex w-full flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
          className="transition-150 flex w-full items-center justify-center rounded-full border bg-green-600 px-6 py-2.5 text-lg text-green-50 transition hover:bg-green-400 hover:text-green-900 dark:bg-green-500 dark:text-green-950 dark:hover:bg-green-700 dark:hover:text-green-100"
        >
          <MdLocalPhone className="scale-125" />
        </Link>
        <Link
          to={`mailto:${matchedUser.email}`}
          className="transition-150 flex w-1/2 items-center justify-center rounded-full border bg-amber-400 px-6 py-2.5 text-lg text-amber-50 transition hover:bg-amber-200 hover:text-amber-600 dark:bg-amber-300 dark:text-amber-900 dark:hover:bg-amber-400 dark:hover:text-amber-950 sm:w-full"
        >
          <MdEmail className="scale-125" />
        </Link>
      </div>
    </div>
  </div>
);

/**
 * Button component for completing a ride or providing feedback based on ride status
 */
const RideActionButton: React.FC<{
  rideDetails: RideFormData;
  user: { id: number } | null;
  onFeedback: () => void;
  onCompleteRide: (ride: RideFormData) => void;
}> = ({ rideDetails, user, onFeedback, onCompleteRide }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Check if ride is completed
  const isCompleted = rideDetails.status === RIDE_STATUS.COMPLETED;

  // Check if user has already provided feedback
  const hasFeedbackPending =
    localStorage.getItem('rideStatus') === RIDE_STATUS.COMPLETED;
  const feedbackKey = getFeedbackKey(rideDetails, user?.id);
  const HAS_SUBMITTED_FEEDBACK = localStorage.getItem(feedbackKey) === 'true';

  const handleClick = async () => {
    if (HAS_SUBMITTED_FEEDBACK) {
      toast.info('You have already submitted feedback for this ride.');
      return;
    }

    if (isCompleted || hasFeedbackPending) {
      onFeedback();
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmComplete = async () => {
    setIsCompleting(true);
    try {
      await onCompleteRide(rideDetails);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error completing ride:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancelComplete = () => {
    setShowConfirmModal(false);
  };

  const buttonText =
    isCompleted || hasFeedbackPending
      ? 'Provide Feedback'
      : 'Complete the ride';
  const buttonColor =
    isCompleted || hasFeedbackPending
      ? 'bg-teal-400 hover:bg-amber-500'
      : 'bg-teal-400 hover:bg-green-500';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`group relative overflow-hidden rounded-full border border-teal-200 px-7 py-3 text-sm text-light dark:border-teal-700 dark:text-dark ${buttonColor}`}
      >
        <span
          className={`absolute inset-0 z-0 animate-slide ${isCompleted || hasFeedbackPending ? 'bg-gradient-to-r from-amber-400 to-amber-500 dark:to-amber-300' : 'bg-gradient-to-r from-green-500 to-green-400'} group-hover:animate-none`}
        ></span>
        <span className="relative z-10 font-medium tracking-wide">
          {buttonText}
        </span>
      </button>

      <ConfirmDialog
        open={showConfirmModal}
        title="Complete the ride?"
        description="This will mark the ride as complete and prompt you to leave feedback."
        confirmText="Complete Ride"
        onConfirm={handleConfirmComplete}
        onCancel={handleCancelComplete}
        loading={isCompleting}
      />
    </>
  );
};

const RideDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showMap, setShowMap] = useState(false);
  const { showFeedbackPopup, setShowFeedbackPopup } = useSocket();
  const [user, setUser] = useState<{ id: number } | null>(null);
  const [matchedUser, setMatchedUser] = useState<UserDetails | null>(null);

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
    const userData = getUserData();

    if (userData) {
      setUser(userData);
    }
  }, []);

  // Listen for ride status changes from socket events
  useEffect(() => {
    const handleStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent<RideStatusChangedEventDetail>;

      if (customEvent.detail.status === RIDE_STATUS.COMPLETED) {
        // Update ride details if ride data is provided
        if (customEvent.detail.ride) {
          setRideDetails((prev: RideFormData) => ({
            ...prev,
            ...customEvent.detail.ride,
          }));
        } else {
          setRideDetails((prev: RideFormData) => ({
            ...prev,
            status: RIDE_STATUS.COMPLETED,
          }));
        }
      }
    };

    window.addEventListener(
      CUSTOM_EVENTS.RIDE_STATUS_CHANGED,
      handleStatusChange,
    );

    return () => {
      window.removeEventListener(
        CUSTOM_EVENTS.RIDE_STATUS_CHANGED,
        handleStatusChange,
      );
    };
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

        // Update rideDetails with complete data from API
        setRideDetails(ride);
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

  // Check if feedback is pending and user hasn't submitted feedback
  const feedbackKey = getFeedbackKey(rideDetails, user?.id);
  const HAS_SUBMITTED_FEEDBACK = localStorage.getItem(feedbackKey) === 'true';
  const showFeedbackBanner =
    rideDetails.status === RIDE_STATUS.COMPLETED && !HAS_SUBMITTED_FEEDBACK;

  // Handle ride completion - SocketManager will handle toast notifications
  const handleCompleteRide = async (ride: RideFormData) => {
    if (!user?.id) {
      console.error('User not found');
      return;
    }

    try {
      await apiFetch(
        `${import.meta.env.VITE_API_BASE_URL}/rides/${ride.id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ userId: user.id }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Update local state - SocketManager will handle toast notifications for both users
      setRideDetails((prev: RideFormData) => ({
        ...prev,
        status: RIDE_STATUS.COMPLETED,
      }));
      localStorage.removeItem('activeRide');
      localStorage.setItem('rideStatus', RIDE_STATUS.COMPLETED);

      // Dispatch event for other components
      dispatchRideStatusChanged({ status: RIDE_STATUS.COMPLETED });
    } catch (error) {
      console.error('Error completing ride:', error);
    }
  };

  return (
    <>
      <main className="relative z-30">
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
              <p className="text-sm font-normal text-dark dark:text-light sm:text-base">
                {from}
              </p>
              <p className="text-sm font-normal text-dark dark:text-light sm:text-base">
                {to}
              </p>
            </div>
          </div>
          <div className="relative rounded-xl bg-teal-200 p-3 dark:bg-teal-500">
            <div className="absolute -top-2 right-5 size-0 origin-top rotate-90 scale-[2] border-l-[10px] border-r-[2px] border-t-[10px] border-l-transparent border-r-transparent border-t-teal-200 dark:border-t-teal-500"></div>
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <p className="pl-2 text-base font-normal text-dark">{message}</p>
              <p className="flex items-center justify-center gap-0.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-normal capitalize text-teal-500 shadow dark:bg-teal-900 dark:text-teal-50 sm:text-base">
                <TbAlarm className="text-sm sm:text-xl" />
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

              <RideActionButton
                rideDetails={rideDetails}
                user={user}
                onFeedback={() => setShowFeedbackPopup(true)}
                onCompleteRide={handleCompleteRide}
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

        {showFeedbackBanner && (
          <p className="fixed bottom-6 left-1/2 z-50 w-max -translate-x-1/2 rounded-full border border-amber-300/50 bg-gradient-to-br from-amber-300 via-amber-50 to-amber-200 py-1 pl-1.5 pr-2 text-xxs font-medium text-amber-900 backdrop-blur-sm transition-all duration-300 sm:py-2 sm:pl-3 sm:pr-4 sm:text-sm">
            <TbInfoCircleFilled className="mr-2 inline-block scale-150 text-sm text-amber-700 sm:text-base" />
            {`Complete this feedback form to redeem your ${
              rideDetails.role === USER_ROLE.RIDER
                ? 'karma points.'
                : 'credit score.'
            }`}
          </p>
        )}
      </main>

      {showFeedbackPopup && (
        <FeedbackModal
          onClose={() => setShowFeedbackPopup(false)}
          handleCompleteRide={handleCompleteRide}
          rideDetails={rideDetails}
          user={user}
        />
      )}
    </>
  );
};

export default RideDetails;
