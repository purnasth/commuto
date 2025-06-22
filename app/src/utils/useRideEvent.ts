import { useContext } from 'react';
import { RideEventContext } from './RideEventContext';

export const useRideEvent = () => {
  const context = useContext(RideEventContext);
  if (!context)
    throw new Error('useRideEvent must be used within RideEventProvider');
  return context;
};
