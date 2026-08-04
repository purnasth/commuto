import { Ride, User } from 'generated/prisma';

import { RIDE_STATUS } from '../constants/enums';

import {
  ContactUserDto,
  PublicUserDto,
  toRideParticipant,
} from './user-response.dto';

/**
 * A Prisma ride with any subset of its user relations loaded.
 * Relations that were not included stay absent from the response so callers
 * can keep distinguishing "not loaded" from "no rider assigned".
 */
export type RideWithParticipants = Ride & {
  rider?: User | null;
  createdByUser?: User | null;
  passengers?: User[];
};

/**
 * Whitelisted ride fields returned to API consumers.
 *
 * Deliberately omits `matchGroupId` (an internal grouping key) and the
 * `requests`, `ratings`, `messages` and `feedback` relations, which carry
 * other users' private content.
 */
export interface RideResponseDto {
  id: number;
  from: string;
  fromLat: number | null;
  fromLng: number | null;
  to: string;
  toLat: number | null;
  toLng: number | null;
  message: string | null;
  role: string;
  timestamp: Date;
  status: string;
  createdBy: number;
  riderId: number | null;
  passengerId: number | null;
  estimatedTimeOfArrival: number | null;
  distance: number | null;
  co2Saved: number | null;
  peopleImpacted: number | null;
  rider?: PublicUserDto | ContactUserDto | null;
  createdByUser?: PublicUserDto | ContactUserDto | null;
  passengers?: (PublicUserDto | ContactUserDto)[];
}

/** A ride response carrying the client-side expiry countdown. */
export interface RideWithExpiryDto extends RideResponseDto {
  expiryTimeSeconds: number;
  remainingTimeSeconds: number;
}

/**
 * Statuses at which the two matched users are allowed to see each other's
 * contact details.
 */
const CONTACT_VISIBLE_STATUSES: ReadonlySet<string> = new Set([
  RIDE_STATUS.CONFIRMED,
  RIDE_STATUS.COMPLETED,
]);

/**
 * Contact details are shared only once a ride is matched, and only with the
 * users actually taking part in it. Anonymous callers (viewerId undefined)
 * never qualify.
 */
export function canViewContactDetails(
  ride: Pick<Ride, 'status' | 'riderId' | 'passengerId' | 'createdBy'>,
  viewerId: number | null | undefined,
): boolean {
  if (!viewerId) {
    return false;
  }

  if (!CONTACT_VISIBLE_STATUSES.has(ride.status)) {
    return false;
  }

  return (
    ride.riderId === viewerId ||
    ride.passengerId === viewerId ||
    ride.createdBy === viewerId
  );
}

/**
 * Maps a Prisma ride to its API representation, exposing contact details on
 * the participant relations only when the viewer is entitled to them.
 *
 * @param ride The ride, with any subset of user relations loaded
 * @param viewerId The authenticated user's id, or undefined for anonymous callers
 */
export function toRideDto(
  ride: RideWithParticipants,
  viewerId?: number | null,
): RideResponseDto {
  const includeContact = canViewContactDetails(ride, viewerId);

  return {
    id: ride.id,
    from: ride.from,
    fromLat: ride.fromLat,
    fromLng: ride.fromLng,
    to: ride.to,
    toLat: ride.toLat,
    toLng: ride.toLng,
    message: ride.message,
    role: ride.role,
    timestamp: ride.timestamp,
    status: ride.status,
    createdBy: ride.createdBy,
    riderId: ride.riderId,
    passengerId: ride.passengerId,
    estimatedTimeOfArrival: ride.estimatedTimeOfArrival,
    distance: ride.distance,
    co2Saved: ride.co2Saved,
    peopleImpacted: ride.peopleImpacted,
    ...(ride.rider !== undefined && {
      rider: toRideParticipant(ride.rider, includeContact),
    }),
    ...(ride.createdByUser !== undefined && {
      createdByUser: toRideParticipant(ride.createdByUser, includeContact),
    }),
    ...(ride.passengers !== undefined && {
      passengers: ride.passengers.map((passenger) =>
        toRideParticipant(passenger, includeContact),
      ),
    }),
  };
}

export function toRideDtoList(
  rides: RideWithParticipants[],
  viewerId?: number | null,
): RideResponseDto[] {
  return rides.map((ride) => toRideDto(ride, viewerId));
}
