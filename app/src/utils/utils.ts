import { RideFormData, UserDetails } from '../interfaces/types';

/**
 * Determines which user should be shown as the matched user based on the current user's role
 * @param ride - The complete ride data from the API
 * @param currentUserId - The ID of the currently logged-in user
 * @returns The matched user to display, or null if no match found
 */
export const determineMatchedUser = (
  ride: RideFormData,
  currentUserId: number,
): UserDetails | null => {
  const isRider = currentUserId.toString() === ride.riderId?.toString();
  const isPassenger = currentUserId.toString() === ride.passengerId?.toString();

  // If current user is the rider, show the passenger
  if (isRider && ride.passengers && ride.passengers.length > 0) {
    return ride.passengers[0]; // Return the first (and typically only) passenger
  }

  // If current user is the passenger, show the rider
  if (isPassenger && ride.rider) {
    return ride.rider;
  }

  return null;
};
