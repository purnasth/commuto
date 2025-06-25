import { createContext } from 'react';
import { RideEventData } from '../contexts/RideEventContext';
type RideEventContextType = {
  rideConfirmedData: RideEventData | null;
  triggerRideConfirmed: (data: RideEventData) => void;
  resetRideConfirmed: () => void;
};
export const RideEventContext = createContext<RideEventContextType | null>(
  null,
);
