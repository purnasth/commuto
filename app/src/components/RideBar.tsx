import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';

import { TbUser, TbMapPin, TbBrandHipchat } from 'react-icons/tb';
import { TbMoodTongueWink2 } from 'react-icons/tb';
import { PiSmileyMeltingBold } from 'react-icons/pi';

import { findRideFormFields } from '../constants/data';

import { RideFormData, RideBarProps } from '../interfaces/types';

import Modal from './ui/Modal';
import AgreeInfo from './ui/AgreeInfo';
import NoRideFound from './ui/NoRideFound';
import SearchingRide from './ui/SearchingRide';

import MessagePopup from './MessagePopup';
import LocationPopup from './LocationPopup';

import RideResultsList from '../pages/RideResultsList';

import useRideForm from '../hooks/useRideForm';
import useScrollVisibility from '../hooks/useScrollVisibility';

import { rideFormSchema } from '../schemas/formSchema';
import { apiFetch } from '../utils/api';
import CurrentRideStatus from './ui/CurrentRideStatus';

const RideBar: React.FC<RideBarProps> = ({ fromHome = false, role }) => {
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ridesFound, setRidesFound] = useState<RideFormData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRideStatusModal, setShowRideStatusModal] = useState(false);
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
      role: role || '',
    },
    resolver: yupResolver(rideFormSchema),
  });

  useEffect(() => {
    if (role) {
      setValue('role', role);
    }
  }, [role, setValue]);

  // Use the custom hook for pre-filling form data
  useRideForm(setValue);

  // Add state for coordinates
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
  const [toCoords, setToCoords] = useState<[number, number] | null>(null);

  // Store last search params for 'search again' feature
  const [lastSearchParams, setLastSearchParams] = useState<{
    role: string;
    fromLat?: number;
    fromLng?: number;
    to?: string;
    from?: string;
    message?: string;
    timestamp?: string;
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
    role: string,
    fromLat?: number,
    fromLng?: number,
    timestamp?: string,
    storeParams = true,
  ) => {
    if (!fromLat || !fromLng || !timestamp) return [];
    if (storeParams) setLastSearchParams({ role, fromLat, fromLng, timestamp });
    try {
      const result = await apiFetch<{ rides: RideFormData[] }>(
        `${import.meta.env.VITE_API_BASE_URL}/rides/match?fromLat=${fromLat}&fromLng=${fromLng}&timestamp=${encodeURIComponent(timestamp)}&role=${role}`,
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
      localStorage.setItem('rideFormData', JSON.stringify(data));
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      toast.error('Please log in to confirm your ride route.');
      navigate('/login');
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
      riderId: user.id,
    };

    const loadingToastId = toast.loading('Submitting your ride route...');

    try {
      await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/rides`, {
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
            `Your ride route has been submitted! It will be visible to ${role === 'rider' ? 'passengers' : 'riders'} sharing the same route.`,
          );
        } else {
          toast.info(
            `Your ride route has been submitted! Currently, no ${role === 'rider' ? 'passengers' : 'riders'} are sharing the same route.`,
          );
        }

        setIsLoading(false);
        setShowModal(true);
        reset({
          from: '',
          to: '',
          message: '',
          role: role || '',
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
    const savedFormData = localStorage.getItem('rideFormData');
    if (savedFormData) {
      const parsedData: Partial<RideFormData> = JSON.parse(savedFormData);

      // Prefill the form fields
      (Object.keys(parsedData) as (keyof RideFormData)[])
        .filter((key) => key !== 'timestamp')
        .forEach((key) => {
          if (parsedData[key]) {
            setValue(key, parsedData[key] as string);
          }
        });

      localStorage.removeItem('rideFormData');
    }
  }, [setValue]);

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

  const handleConfirm = async (ride: RideFormData) => {
    try {
      await apiFetch(
        `${import.meta.env.VITE_API_BASE_URL}/rides/${ride.id}/confirm`,
        {
          method: 'POST',
        },
      );
      setRidesFound((prev) => prev.filter((r) => r.id !== ride.id));
      toast.success('Congratulations! Your ride has been confirmed!');
      setShowModal(false);
      navigate(
        `/ride-details?from=${encodeURIComponent(ride.from)}&to=${encodeURIComponent(
          ride.to,
        )}&message=${encodeURIComponent(ride.message)}&role=${encodeURIComponent(
          ride.role,
        )}&timestamp=${encodeURIComponent(ride.timestamp ?? '')}`,
      );
    } catch {
      toast.error('Failed to confirm ride.');
    }
  };

  const handleReject = async (ride: RideFormData) => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      await apiFetch(
        `${import.meta.env.VITE_API_BASE_URL}/rides/${ride.id}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ userId: user?.id }),
        },
      );
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
        `${import.meta.env.VITE_API_BASE_URL}/rides/history?userId=${user.id}`,
      );
      const rides = res.rides || [];
      // Find the latest ride that is not already CANCELLED or REJECTED
      const cancellableRide = rides.find(
        (r) =>
          r.riderId === user.id &&
          r.status !== undefined &&
          r.status !== 'CANCELLED' &&
          r.status !== 'REJECTED',
      );
      if (!cancellableRide) {
        toast.info('No ride to cancel.');
        return;
      }
      // Call cancel endpoint
      await apiFetch(
        `${import.meta.env.VITE_API_BASE_URL}/rides/${cancellableRide.id}/cancel`,
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
      lastSearchParams.role === 'rider' || lastSearchParams.role === 'passenger'
        ? lastSearchParams.role
        : 'rider';
    return {
      from: lastSearchParams.from || '-',
      to: lastSearchParams.to || '-',
      message: lastSearchParams.message || '-',
      role: roleValue as 'rider' | 'passenger',
      time: lastSearchParams.timestamp
        ? new Date(lastSearchParams.timestamp).toLocaleString()
        : '',
    };
  };

  if (isLoading) {
    return (
      <Modal onClose={() => setIsLoading(false)}>
        <SearchingRide />
      </Modal>
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
        <Modal onClose={handleCloseModal} aria-labelledby="modal-title">
          {ridesFound.length > 0 ? (
            <RideResultsList
              ridesFound={ridesFound}
              role={role || ''}
              handleConfirm={handleConfirm}
              handleReject={handleReject}
            />
          ) : (
            <>
              <NoRideFound />
            </>
          )}
        </Modal>
      )}

      {/* Ride Status Modal */}
      {showRideStatusModal && lastSearchParams && (
        <Modal
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
        </Modal>
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
