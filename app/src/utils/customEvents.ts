import { CUSTOM_EVENTS } from '../constants/enums';
import { RideStatusChangedEventDetail } from '../interfaces/types';

/**
 * Utility function to dispatch ride status changed events
 * Provides type safety and consistent event dispatching across the application
 */
export const dispatchRideStatusChanged = (detail: RideStatusChangedEventDetail) => {
  window.dispatchEvent(
    new CustomEvent(CUSTOM_EVENTS.RIDE_STATUS_CHANGED, { detail })
  );
};