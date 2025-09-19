import React, { useEffect, useState } from 'react';

import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';

import { TbMoodTongueWink2 } from 'react-icons/tb';
import { PiSmileyMeltingBold } from 'react-icons/pi';
import { TbUser, TbMapPin, TbBrandHipchat } from 'react-icons/tb';

import {
  USER_ROLE,
  RIDE_STATUS,
  LS_RIDE_FORM_DATA_KEY,
} from '../constants/enums';
import { ROUTE_LOGIN } from '../constants/routes';
import { findRideFormFields } from '../constants/data';

import { rideFormSchema } from '../schemas/formSchema';

import { apiFetch } from '../utils/api';
import { useRideEvent } from '../utils/useRideEvent';

import { RideFormData, RideBarProps, UserDetails } from '../interfaces/types';

import AgreeInfo from './ui/AgreeInfo';
import NoRideFound from './ui/NoRideFound';
import SearchingRide from './ui/SearchingRide';
import FullScreenModal from './ui/FullScreenModal';
import CurrentRideStatus from './ui/CurrentRideStatus';

import MessagePopup from './MessagePopup';
import LocationPopup from './LocationPopup';

import RideResultsList from '../pages/RideResultsList';

import useRideForm from '../hooks/useRideForm';
import useScrollVisibility from '../hooks/useScrollVisibility';

const RideBar: React.FC<RideBarProps> = ({ fromHome = false, role }) => {
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ridesFound, setRidesFound] = useState<RideFormData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRideStatusModal, setShowRideStatusModal] = useState(false);
  const [socket] = useState(() => io(import.meta.env.VITE_SOCKET_URL));
  const [, setNotifications] = useState<string[]>([]);
  const [user, setUser] = useState<{ id: number } | null>(null);
  const navigate = useNavigate();
  const showRideBar = useScrollVisibility(100);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RideFormData>({
    defaultValues: {
      from: '',
      to: '',
      message: '',
      role: role,
    },
    resolver: yupResolver(rideFormSchema),
  });

  useEffect(() => {
    if (role) {
      setValue('role', role);
    }
  }, [role, setValue]);

  // Use the custom hook for pre-filling form data
  const savedCoords = useRideForm(setValue);

  // Set coordinates when saved data is loaded
  useEffect(() => {
    if (savedCoords.fromCoords) {
      setFromCoords(savedCoords.fromCoords);
    }
    if (savedCoords.toCoords) {
      setToCoords(savedCoords.toCoords);
    }
  }, [savedCoords]);

  // Add state for coordinates
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
  const [toCoords, setToCoords] = useState<[number, number] | null>(null);

  // Store last search params for 'search again' feature
  const [lastSearchParams, setLastSearchParams] = useState<{
    role: USER_ROLE;
    fromLat?: number;
    fromLng?: number;
    to?: string;
    from?: string;
    message?: string;
    timestamp?: string;
    status?: RIDE_STATUS;
  } | null>(null);

  const handleInputClick = (fieldName: string) => {
    if (fieldName === 'from' || fieldName === 'to') {
      setActiveInput(fieldName as 'from' | 'to');
      setShowLocationPopup(true);
      setShowMessagePopup(false);
    } else if (fieldName === 'message') {
      setShowMessagePopup(true);
      setShowLocationPopup(false);
    }
  };

  const handleLocationSelect = (
    location: string,
    coordinates?: [number, number],
  ) => {
    setValue(activeInput!, location);
    if (activeInput === 'from') setFromCoords(coordinates || null);
    if (activeInput === 'to') setToCoords(coordinates || null);
    setShowLocationPopup(false);
  };

  const handleMessageSelect = (message: string) => {
    setValue('message', message);
    setShowMessagePopup(false);
  };

  const fetchAvailableRides = async (
    role: USER_ROLE,
    fromLat?: number,
    fromLng?: number,
    timestamp?: string,
    storeParams = true,
  ) => {
    if (!fromLat || !fromLng || !timestamp) return [];
    if (storeParams) setLastSearchParams({ role, fromLat, fromLng, timestamp });
    try {
      const result = await apiFetch<{ rides: RideFormData[] }>(
        `${import.meta.env.VITE_API_BASE_URL}/rides/match?fromLat=${fromLat}&fromLng=${fromLng}&timestamp=${encodeURIComponent(timestamp)}&role=${role}`, // TODO: Centralize API path if used in multiple places
      );
      return result.rides;
    } catch {
      return [];
    }
  };

  // Add a handler for 'Search Again'
  const handleSearchAgain = async () => {
    if (!lastSearchParams) return;
    setShowRideStatusModal(false); // Always close ride status modal when searching again
    setIsLoading(true);
    const availableRides = await fetchAvailableRides(
      lastSearchParams.role,
      lastSearchParams.fromLat,
      lastSearchParams.fromLng,
      lastSearchParams.timestamp,
      false,
    );
    setRidesFound(availableRides);
    setIsLoading(false);
    if (availableRides.length > 0) {
      setShowModal(true);
    } else {
      setShowModal(true);
    }
  };

  const onSubmit = async (data: RideFormData) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      // Include coordinates in the stored data for non-logged-in users
      const dataWithCoordinates = {
        ...data,
        fromLat: fromCoords ? fromCoords[1] : undefined,
        fromLng: fromCoords ? fromCoords[0] : undefined,
        toLat: toCoords ? toCoords[1] : undefined,
        toLng: toCoords ? toCoords[0] : undefined,
      };

      localStorage.setItem(
        LS_RIDE_FORM_DATA_KEY,
        JSON.stringify(dataWithCoordinates),
      );
      localStorage.setItem('redirectAfterLogin', window.location.pathname);

      toast.error('Please log in to confirm your ride route.');
      navigate(ROUTE_LOGIN);

      return;
    }
    const user = JSON.parse(userStr);
    const rideWithTimestamp = {
      ...data,
      fromLat: fromCoords ? fromCoords[1] : undefined,
      fromLng: fromCoords ? fromCoords[0] : undefined,
      toLat: toCoords ? toCoords[1] : undefined,
      toLng: toCoords ? toCoords[0] : undefined,
      timestamp: new Date().toISOString(),
      createdBy: user.id, // Changed from riderId to createdBy
    };

    const loadingToastId = toast.loading('Submitting your ride route...');

    try {
      await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/rides`, {
        // TODO: Centralize API path if used in multiple places
        method: 'POST',
        body: JSON.stringify(rideWithTimestamp),
      });

      toast.dismiss(loadingToastId);
      setIsLoading(true);
      setTimeout(async () => {
        const availableRides = await fetchAvailableRides(
          data.role,
          rideWithTimestamp.fromLat,
          rideWithTimestamp.fromLng,
          rideWithTimestamp.timestamp,
        );

        setRidesFound(availableRides);

        // Save all ride details in lastSearchParams for status modal
        setLastSearchParams({
          role: data.role,
          fromLat: fromCoords ? fromCoords[1] : undefined,
          fromLng: fromCoords ? fromCoords[0] : undefined,
          to: data.to,
          from: data.from,
          message: data.message,
          timestamp: new Date().toISOString(),
        });

        if (availableRides.length > 0) {
          toast.success(
            `Your ride route has been submitted! It will be visible to ${role === USER_ROLE.RIDER ? 'passengers' : 'riders'} sharing the same route.`,
          );
        } else {
          toast.info(
            `Your ride route has been submitted! Currently, no ${role === USER_ROLE.RIDER ? 'passengers' : 'riders'} are sharing the same route.`,
          );
        }

        setIsLoading(false);
        setShowModal(true);
        reset({
          from: '',
          to: '',
          message: '',
          role: role as USER_ROLE,
        });
      }, 2000);
    } catch (err) {
      toast.dismiss(loadingToastId);
      // Show backend validation error for duplicate ride
      const msg = (err as Error).message;
      if (msg) {
        toast.error(msg);
      } else {
        toast.error(msg || 'Failed to submit ride.');
      }
    }
  };

  useEffect(() => {
    const savedSearchParams = localStorage.getItem('lastSearchParams');
    if (savedSearchParams) {
      setLastSearchParams(JSON.parse(savedSearchParams));
    }
  }, []);

  const onError = () => {
    const errorMessages = Object.values(errors)
      .map((error) => error?.message)
      .filter(Boolean)
      .join(', ');
    if (errorMessages) {
      toast.error(`Please fill out all the fields:`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // useEffect will update mainAction
  };

  const handleShowAvailableRides = () => {
    setShowModal(true);
    // useEffect will update mainAction
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const registerUserOnConnect = () => {
      if (user?.id) {
        console.log(`Attempting to register user ${user.id}`);
        socket.emit('registerUser', user.id.toString());
      }
    };

    socket.on('connect', registerUserOnConnect);

    if (socket.connected && user?.id) {
      registerUserOnConnect();
    }

    socket.on('rideConfirmed', (payload) => {
      console.log('Ride confirmed notification received:', payload);

      let notificationMessage = `Ride ${payload.id} from ${payload.from} to ${payload.to} has been confirmed!`;

      if (payload.riderId === user?.id || payload.passengerId === user?.id) {
        notificationMessage = `Your ride (${payload.id}) has been confirmed!`;
      } else {
        notificationMessage = `A ride you requested/are interested in (${payload.id}) has been confirmed!`;
      }
      setNotifications((prev) => [...prev, notificationMessage]);

      // Update the status of the specific ride(s) in your local state
      setRidesFound((prevRides) =>
        prevRides.map((ride) =>
          ride.id === payload.id ? { ...ride, status: payload.status } : ride,
        ),
      );
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socket.off('connect', registerUserOnConnect);
      socket.off('rideConfirmed');
      socket.off('disconnect');
    };
  }, [user, socket]);

  const { triggerRideConfirmed } = useRideEvent();

  const handleConfirm = async (ride: RideFormData) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error('You must be logged in to confirm a ride.');
        return;
      }

      const user = JSON.parse(userStr);

      // First, we need to find the current user's own ride to get the proper IDs
      try {
        const userRidesResponse = await apiFetch<{ rides: RideFormData[] }>(
          `${import.meta.env.VITE_API_BASE_URL}/rides/history?userId=${user.id}`,
        );

        const userRides = userRidesResponse.rides || [];

        // Find the user's most recent active ride where they are creator, rider, or passenger
        const currentUserRide = userRides.find(
          (r) =>
            (r.createdBy === user.id ||
              r.riderId === user.id ||
              r.passengerId === user.id) &&
            (r.status === RIDE_STATUS.ACTIVE || r.status === undefined),
        );

        if (!currentUserRide) {
          // Check if user has any recent rides that might have been cancelled/expired
          const recentRides = userRides.filter((r) => {
            const rideTime = new Date(r.timestamp || '');
            const now = new Date();
            const timeDiff = now.getTime() - rideTime.getTime();
            const minutesDiff = timeDiff / (1000 * 60);
            return minutesDiff <= 30; // Within last 30 minutes
          });

          if (recentRides.length > 0) {
            toast.error(
              'Your recent ride has expired or been cancelled. Please create a new active ride first before confirming others.',
            );
          } else {
            toast.error(
              'You need to create your own ride first before confirming others.',
            );
          }
          return;
        }

        // Determine what payload to send based on current user's role and the ride being confirmed
        let confirmPayload: {
          passengerId?: number;
          passengerRideId?: number;
          riderId?: number;
          riderRideId?: number;
        } = {};

        if (user.role.toLowerCase() === USER_ROLE.RIDER.toLowerCase()) {
          // Current user is a rider, confirming a passenger's ride
          // The ride being confirmed should have a passengerId set (passenger who created it)
          const passengerUserId = ride.passengerId || ride.createdBy;

          if (!passengerUserId || !ride.id) {
            toast.error('Invalid passenger or ride ID. Please try again.');

            return;
          }

          confirmPayload = {
            passengerId: parseInt(passengerUserId.toString()),
            passengerRideId: parseInt(ride.id.toString()),
          };
        } else {
          // Current user is a passenger, confirming a rider's ride
          // The ride being confirmed should have a riderId set (rider who created it)
          const riderUserId = ride.riderId || ride.createdBy;

          if (!riderUserId || !ride.id) {
            toast.error('Invalid rider or ride ID. Please try again.');

            return;
          }

          confirmPayload = {
            riderId: parseInt(riderUserId.toString()),
            riderRideId: parseInt(ride.id.toString()),
          };
        }

        await apiFetch(
          `${import.meta.env.VITE_API_BASE_URL}/rides/${currentUserRide.id}/confirm`,
          {
            method: 'POST',
            body: JSON.stringify(confirmPayload),
          },
        );

        setRidesFound((prev) => prev.filter((r) => r.id !== ride.id));
        triggerRideConfirmed({
          id: ride.id,
          from: ride.from,
          to: ride.to,
          message: ride.message,
          role: ride.role,
          timestamp: ride.timestamp,
          status: RIDE_STATUS.CONFIRMED,
          riderId: ride.riderId,
        });
        toast.success('Congratulations! Your ride has been confirmed!');
        setShowModal(false);
      } catch (apiError) {
        console.error('Failed to fetch user rides or confirm:', apiError);
        toast.error('Failed to confirm ride. Please try again.');
        return;
      }
    } catch {
      toast.error('Failed to confirm ride.');
    }
  };

  const handleReject = async (ride: RideFormData) => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      await apiFetch(
        `${import.meta.env.VITE_API_BASE_URL}/rides/${ride.id}/reject`, // TODO: Centralize API path if used in multiple places
        {
          method: 'POST',
          body: JSON.stringify({ userId: user?.id }),
        },
      );
      localStorage.removeItem('lastSearchParams');
      setRidesFound((prev) => prev.filter((r) => r.id !== ride.id));
      toast.info('Ride has been rejected.');
    } catch {
      toast.error('Failed to reject ride.');
    }
  };

  // Cancel Ride handler
  const handleCancelRide = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error('You must be logged in to cancel a ride.');
        return;
      }
      const user = JSON.parse(userStr);
      // Try to get the user's latest ride that is not already CANCELLED or REJECTED
      const res = await apiFetch<{ rides: RideFormData[] }>(
        `${import.meta.env.VITE_API_BASE_URL}/rides/history?userId=${user.id}`, // TODO: Centralize API path if used in multiple places
      );
      const rides = res.rides || [];
      // Find the latest ride that is not already CANCELLED or REJECTED
      const cancellableRide = rides.find(
        (r) =>
          (r.createdBy === user.id ||
            r.riderId === user.id ||
            r.passengerId === user.id) &&
          r.status !== undefined &&
          r.status !== RIDE_STATUS.CANCELLED &&
          r.status !== RIDE_STATUS.REJECTED,
      );
      localStorage.removeItem('lastSearchParams');

      if (!cancellableRide) {
        toast.info('No ride to cancel.');
        return;
      }
      // Call cancel endpoint
      await apiFetch(
        `${import.meta.env.VITE_API_BASE_URL}/rides/${cancellableRide.id}/cancel`, // TODO: Centralize API path if used in multiple places
        {
          method: 'POST',
          body: JSON.stringify({ userId: user.id }),
        },
      );
      toast.success('Your ride has been cancelled.');
      setShowRideStatusModal(false);
      setLastSearchParams(null);
      setRidesFound([]);
    } catch {
      toast.error('Failed to cancel ride.');
    }
  };

  // Determine if the user's role matches the RideBar's role (case-insensitive)m
  let userRole: string | null = null;
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        userRole = JSON.parse(userStr).role;
      } catch {
        // Ignore JSON parse errors
      }
    }
  }
  const roleMismatch =
    userRole && role && userRole.toLowerCase() !== role.toLowerCase();

  // Helper to get current ride details from lastSearchParams
  const getCurrentRideDetails = () => {
    if (!lastSearchParams) return null;
    // Ensure role is either "rider" or "passenger"
    const roleValue =
      lastSearchParams.role === USER_ROLE.RIDER ||
      lastSearchParams.role === USER_ROLE.PASSENGER
        ? lastSearchParams.role
        : USER_ROLE.RIDER;
    return {
      from: lastSearchParams.from || '-',
      to: lastSearchParams.to || '-',
      message: lastSearchParams.message || '-',
      role: roleValue as USER_ROLE,
      time: lastSearchParams.timestamp
        ? new Date(lastSearchParams.timestamp).toLocaleString()
        : '',
    };
  };

  // ISSUE #50: persist last search params in localStorage
  useEffect(() => {
    const savedParams = localStorage.getItem('lastSearchParams');
    if (savedParams) {
      const parsed = JSON.parse(savedParams);
      setLastSearchParams(parsed);

      if (parsed.role && parsed.fromLat && parsed.fromLng && parsed.timestamp) {
        fetchAvailableRides(
          parsed.role,
          parsed.fromLat,
          parsed.fromLng,
          parsed.timestamp,
          false,
        ).then((rides) => setRidesFound(rides));
      }
    }
  }, []);

  useEffect(() => {
    if (lastSearchParams) {
      localStorage.setItem(
        'lastSearchParams',
        JSON.stringify(lastSearchParams),
      );
    }
  }, [lastSearchParams]);
  if (isLoading) {
    return (
      <FullScreenModal onClose={() => setIsLoading(false)}>
        <SearchingRide />
      </FullScreenModal>
    );
  }

  return (
    <>
      <main
        className={`${
          fromHome
            ? `fixed bottom-0 z-40 w-full bg-none py-0 transition-all duration-500 ease-in-out ${
                window.scrollY > 0 ? 'py-0' : 'px-6'
              } ${showRideBar ? 'translate-y-0' : 'translate-y-full lg:translate-y-20'}`
            : 'my-0 p-0'
        }`}
      >
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="flex flex-col items-center justify-between gap-2 rounded-3xl border bg-white p-2 shadow dark:border-teal-300 dark:bg-teal-600 lg:flex-row lg:rounded-full"
          aria-labelledby="ride-form-title"
        >
          {findRideFormFields.map(
            ({ name, label, type, placeholder, options }) => (
              <div
                key={name}
                className="relative inline-flex w-full items-center rounded-full bg-teal-100 focus-within:ring-1 focus-within:ring-teal-600"
              >
                <label
                  htmlFor={name}
                  className="inline-flex min-w-fit items-center gap-2 py-3 pl-4 text-sm text-dark"
                >
                  {name === 'from' || name === 'to' ? (
                    <TbMapPin className="text-lg" />
                  ) : null}
                  {name === 'message' ? (
                    <TbBrandHipchat className="text-lg" />
                  ) : null}
                  {name === 'role' ? <TbUser className="text-lg" /> : null}
                  {label}
                </label>
                {name === 'role' && role ? (
                  <span className="mr-2 w-full rounded-full bg-transparent px-2 py-3 text-sm font-normal text-dark">
                    {role}
                  </span>
                ) : type === 'select' ? (
                  <select
                    id={name}
                    {...register(name)}
                    className={`mr-2 w-full rounded-full bg-transparent px-2 py-3 text-sm ring-inset focus:outline-none ${
                      errors[name] ? 'text-red-600' : 'text-dark'
                    }`}
                  >
                    <option value="" disabled>
                      {errors[name]
                        ? (errors[name]?.message as string)
                        : `Select your role`}
                    </option>
                    {options?.map((option) => (
                      <option
                        key={option}
                        value={option.toLowerCase()}
                        className="text-dark"
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={type}
                    id={name}
                    {...register(name)}
                    onClick={() => handleInputClick(name)}
                    readOnly={name === 'from' || name === 'to'}
                    className={`w-full rounded-full bg-transparent px-2 py-3 text-sm text-dark ring-inset focus:outline-none ${
                      errors[name] ? 'placeholder:text-red-600' : ''
                    }`}
                    placeholder={
                      errors[name]
                        ? (errors[name]?.message as string)
                        : // 'is required*'
                          placeholder
                    }
                  />
                )}
              </div>
            ),
          )}
          <button
            type="submit"
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-300 px-6 py-3 text-sm hover:!bg-teal-300 dark:text-dark lg:w-fit ${roleMismatch ? 'cursor-not-allowed' : ''}`}
            // disabled={!!roleMismatch}
            // aria-disabled={!!roleMismatch}
            // title={
            //   roleMismatch
            //     ? `You are a '${userRole}', not a '${role}'. You cannot post as this role.`
            //     : 'Confirm your ride route'
            // }
          >
            Confirm
          </button>
        </form>
      </main>
      {!fromHome && <AgreeInfo />}

      {showLocationPopup && (
        <LocationPopup
          activeInput={activeInput}
          onClose={() => setShowLocationPopup(false)}
          onSelect={handleLocationSelect}
          initialSearchQuery={activeInput ? '' : ''}
        />
      )}
      {showMessagePopup && (
        <MessagePopup
          onSelect={handleMessageSelect}
          onClose={() => setShowMessagePopup(false)}
        />
      )}

      {showModal && (
        <FullScreenModal
          onClose={handleCloseModal}
          aria-labelledby="modal-title"
        >
          {ridesFound.length > 0 ? (
            <RideResultsList
              ridesFound={
                ridesFound.filter(
                  (ride) => ride.createdByUser, // For ACTIVE rides, we just need the creator
                ) as Array<
                  RideFormData & {
                    createdByUser: UserDetails;
                  }
                >
              }
              role={role as USER_ROLE}
              handleConfirm={handleConfirm}
              handleReject={handleReject}
            />
          ) : (
            <>
              <NoRideFound />
            </>
          )}
        </FullScreenModal>
      )}

      {/* Ride Status Modal */}
      {showRideStatusModal && lastSearchParams && (
        <FullScreenModal
          onClose={() => setShowRideStatusModal(false)}
          aria-labelledby="ride-status-modal-title"
        >
          {(() => {
            const details = getCurrentRideDetails();
            if (!details) return null;
            return (
              <CurrentRideStatus
                details={details}
                onSearchAgain={handleSearchAgain}
                onCancelRide={handleCancelRide}
              />
            );
          })()}
        </FullScreenModal>
      )}

      {/* Show Available Rides button if there are rides and modal is closed */}
      {ridesFound.length > 0 && !showModal && (
        <button
          type="button"
          aria-label="Show available rides"
          onClick={handleShowAvailableRides}
          className="fixed left-1/2 top-0 z-50 flex origin-center -translate-x-1/2 items-center gap-1.5 rounded-xl rounded-t-none bg-gradient-to-r from-teal-300 via-teal-400 to-teal-600 py-1.5 pl-4 pr-5 text-xs font-normal text-dark shadow-xl transition-all duration-200 hover:scale-105 hover:from-teal-400 hover:to-teal-500 md:text-base"
        >
          <TbMoodTongueWink2 className="text-sm md:text-lg" />
          Available Rides
        </button>
      )}

      {/* Show My Current Ride Status button if no rides found, modal is closed, and user still has an active ride (ridesFound.length === 0) */}
      {ridesFound.length === 0 && !showModal && lastSearchParams && (
        <button
          type="button"
          aria-label="Current Ride Status"
          onClick={() => setShowRideStatusModal(true)}
          className="fixed left-1/2 top-0 z-50 flex origin-center -translate-x-1/2 items-center gap-1.5 rounded-xl rounded-t-none bg-gradient-to-r from-teal-300 via-teal-400 to-teal-400 px-5 py-1.5 text-xs font-normal text-dark shadow-xl transition-all duration-200 hover:scale-105 hover:from-teal-400 hover:to-teal-500 md:text-base"
        >
          <PiSmileyMeltingBold className="text-sm md:text-lg" />
          Current Ride Status
        </button>
      )}
    </>
  );
};

export default RideBar;
