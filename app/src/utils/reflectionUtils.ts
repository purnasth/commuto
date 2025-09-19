import { RideHistory } from '../interfaces/types';

export interface ImpactedPerson {
  id: number;
  name: string;
  img: string;
}

/**
 * Extracts unique people that the current user has impacted through completed rides
 * @param completedRides - Array of completed rides
 * @param currentUserId - ID of the current user
 * @returns Array of unique people the user has shared rides with
 */
export const getPeopleImpactedFromRides = (
  completedRides: RideHistory[],
  currentUserId: number,
): ImpactedPerson[] => {
  const peopleMap = new Map<number, ImpactedPerson>();
  const defaultProfilePicture =
    'https://avatars.githubusercontent.com/u/107195487?v=4';

  completedRides.forEach((ride) => {
    // If current user is a rider, add passengers
    if (ride.riderId === currentUserId && ride.passengers) {
      ride.passengers.forEach((passenger) => {
        if (!peopleMap.has(passenger.id)) {
          peopleMap.set(passenger.id, {
            id: passenger.id,
            name: passenger.fullname,
            img: passenger.profilePicture || defaultProfilePicture,
          });
        }
      });
    }

    // If current user is a passenger, add the rider
    if (ride.passengerId === currentUserId && ride.rider) {
      if (!peopleMap.has(ride.rider.id)) {
        peopleMap.set(ride.rider.id, {
          id: ride.rider.id,
          name: ride.rider.fullname,
          img: ride.rider.profilePicture || defaultProfilePicture,
        });
      }
    }

    // Handle case where user is in passengers array
    if (
      ride.passengers &&
      ride.passengers.some((p) => p.id === currentUserId)
    ) {
      // Add the rider if different from current user
      if (ride.rider && ride.rider.id !== currentUserId) {
        if (!peopleMap.has(ride.rider.id)) {
          peopleMap.set(ride.rider.id, {
            id: ride.rider.id,
            name: ride.rider.fullname,
            img: ride.rider.profilePicture || defaultProfilePicture,
          });
        }
      }

      // Add other passengers
      ride.passengers.forEach((passenger) => {
        if (passenger.id !== currentUserId && !peopleMap.has(passenger.id)) {
          peopleMap.set(passenger.id, {
            id: passenger.id,
            name: passenger.fullname,
            img: passenger.profilePicture || defaultProfilePicture,
          });
        }
      });
    }
  });

  return Array.from(peopleMap.values());
};

/**
 * Splits people array into visible and overflow groups for UI display
 * @param people - Array of people to display
 * @param maxVisible - Maximum number of people to show before overflow (default: 12)
 * @returns Object with visible and overflow arrays
 */
export const splitPeopleForDisplay = (
  people: ImpactedPerson[],
  maxVisible: number = 12,
) => {
  const visible = people.slice(0, maxVisible);
  const others = people.length > maxVisible ? people.slice(maxVisible) : [];

  return { visible, others };
};
