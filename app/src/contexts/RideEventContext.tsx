import { useState } from 'react';
import { RideEventContext } from '../utils/RideEventContext';
export type RideEventData = {
  id: string | undefined;
  from: string;
  to: string;
  message?: string | undefined;
  role: string;
  timestamp?: string;
  status: string;
  riderId: string | undefined;
};
export const RideEventProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [rideConfirmedData, setRideConfirmedData] =
    useState<RideEventData | null>(null);

  const triggerRideConfirmed = (data: RideEventData) =>
    setRideConfirmedData(data);
  const resetRideConfirmed = () => {
    setRideConfirmedData(null);
    console.log('invoked resertRideConfirmed');
    localStorage.removeItem('activeRide');
    localStorage.removeItem('rideConfirmedData');
    localStorage.removeItem('showRideButton');
  };

  return (
    <RideEventContext.Provider
      value={{ rideConfirmedData, triggerRideConfirmed, resetRideConfirmed }}
    >
      {children}
    </RideEventContext.Provider>
  );
};
