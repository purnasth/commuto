import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TbAlarm, TbCircleDashed, TbMapPin, TbMapSearch } from 'react-icons/tb';
import { formatFullDate } from '../utils/functions';
import { FaWalking } from 'react-icons/fa';
import { MdOutlineDirectionsBike } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { USER_ROLE } from '../constants/enums';
import { useRideEvent } from '../utils/useRideEvent';
import { ROUTE_PROFILE } from '../constants/routes';
import { useSocket } from '../utils/useSocket';
import { io } from 'socket.io-client';
import { apiFetch } from '../utils/api';
import { RideFormData } from '../interfaces/types';

const RideDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showMap, setShowMap] = useState(false);
  const { showFeedbackPopup, setShowFeedbackPopup } = useSocket();

  const [socket] = useState(() => io(import.meta.env.VITE_SOCKET_URL));
  const [user, setUser] = useState<{ id: number } | null>(null);
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
  const from = rideDetails.from;
  const to = rideDetails.to;
  const message = rideDetails.message;
  const role = rideDetails.role;
  const timestamp = rideDetails.timestamp;

  // const getDirectionsUrl = () => {
  //   if (!from || !to) return 'https://www.openstreetmap.org';
  //   return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(from)}%3B${encodeURIComponent(to)}`;
  // };

  const getDirectionsUrl = () => {
    if (!rideDetails.from || !rideDetails.to)
      return 'https://www.openstreetmap.org';
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(rideDetails.from)}%3B${encodeURIComponent(rideDetails.to)}`;
  };

  const { resetRideConfirmed } = useRideEvent();
  const rideChannel = useMemo(() => new BroadcastChannel('rideChannel'), []);

  const rideChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    rideChannelRef.current = new BroadcastChannel('rideChannel');

    return () => {
      rideChannelRef.current?.close();
    };
  }, []);

  // useEffect(() => {
  //   const registerUserOnConnect = () => {
  //     if (user?.id) {
  //       console.log(`Attempting to register user ${user.id}`);
  //       socket.emit('registerUser', user.id.toString());
  //     }
  //   };

  //   socket.on('connect', registerUserOnConnect);

  //   if (socket.connected && user?.id) {
  //     registerUserOnConnect();
  //   }

  //   socket.on('rideCompleted', (payload) => {
  //     console.log('Ride completed notification received:', payload);

  //     let notificationMessage = `Ride ${payload.id} from ${payload.from} to ${payload.to} has been confirmed!`;
  //   });

  //   socket.on('disconnect', () => {
  //     console.log('Disconnected from WebSocket server');
  //   });

  //   return () => {
  //     socket.off('connect', registerUserOnConnect);
  //     socket.off('rideConfirmed');
  //     socket.off('disconnect');
  //   };
  // }, [socket]);

  const handleCompleteRide = async (ride: RideFormData) => {
    try {
      console.log('ride', ride);

      // if (!ride || !ride.id) {
      //   console.error('Invalid ride data:', ride);
      //   return;
      // }
      await apiFetch(
        `${import.meta.env.VITE_API_BASE_URL}/rides/${ride.id}/complete`,
        {
          method: 'POST',
        },
      );

      // Reset ride status in local storage
      localStorage.removeItem('activeRide');
      localStorage.setItem('rideStatus', 'completed');

      // setRideStatus('completed');

      // if (rideChannelRef.current) {
      //   rideChannelRef.current.postMessage({ type: 'RESET_RIDE', user });
      // } else {
      //   console.error('BroadcastChannel is closed');
      // }
      // resetRideConfirmed();
    } catch (error) {
      console.error('Error completing ride:', error);
    }
  };
  // useEffect(() => {
  //   if (rideChannelRef.current) {
  //     rideChannelRef.current.onmessage = (event) => {
  //       if (event.data.type === 'RESET_RIDE') {
  //         console.log('Ride reset event received:', event.data);

  //         localStorage.removeItem('activeRide');
  //         resetRideConfirmed();
  //       }
  //     };
  //   }

  //   return () => {};
  // }, [resetRideConfirmed]);

  return (
    <main>
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
            <button
              type="button"
              onClick={() => {
                handleCompleteRide(rideDetails);
              }}
              // onClick={handleCompleteRide}
              className="group relative overflow-hidden rounded-full border border-teal-200 bg-teal-400 px-7 py-3 text-sm text-light hover:bg-green-500 dark:text-dark"
            >
              <span className="absolute inset-0 z-0 animate-slide bg-gradient-to-r from-green-500 to-green-400 group-hover:animate-none"></span>
              <span className="relative z-10 font-medium tracking-wide">
                Complete the ride
              </span>
            </button>
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

      {showFeedbackPopup && (
        <FeedbackModal onClose={() => setShowFeedbackPopup(false)} />
      )}
    </main>
  );
};

export default RideDetails;
const FeedbackModal = ({ onClose }: { onClose: () => void }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    console.log('Feedback submitted:', { rating, comment });
    navigate(ROUTE_PROFILE);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-[90%] max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          Rate Your Ride
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          How was your experience with this ride?
        </p>

        <div>
          <p className="mb-2 text-sm text-gray-600">Select an emoji:</p>
          <div className="flex gap-2">
            {['😀', '😊', '😐', '😞', '😠'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => setRating(emoji.charCodeAt(0))}
                className={`text-2xl transition-colors ${
                  rating === emoji.charCodeAt(0)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Text Feedback */}
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment (optional)"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded bg-gray-300 px-4 py-2 text-sm hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className={`rounded px-4 py-2 text-sm text-white transition-colors ${
              rating === 0
                ? 'cursor-not-allowed bg-teal-300'
                : 'bg-teal-500 hover:bg-teal-600'
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
