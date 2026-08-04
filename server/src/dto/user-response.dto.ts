import { User } from 'generated/prisma';

/**
 * The user columns the participant projections read.
 *
 * Declared as a Pick rather than the full `User` so queries can `select` just
 * these columns and still satisfy the mappers -- a full row remains assignable.
 */
export type ParticipantSource = Pick<
  User,
  | 'id'
  | 'fullname'
  | 'role'
  | 'profilePicture'
  | 'ratings'
  | 'email'
  | 'phone'
  | 'address'
>;

/**
 * Minimal user projection safe to expose to any API consumer, including
 * unauthenticated ones (public ride listings, match results).
 *
 * Deliberately omits: password, email, phone, address, karmaPoints,
 * creditScore, createdAt, updatedAt.
 */
export interface PublicUserDto {
  id: number;
  fullname: string;
  role: string;
  profilePicture: string | null;
  ratings: number | null;
}

/**
 * A public profile plus contact details.
 *
 * Only ever returned for the counterparty of a ride the viewer is a
 * participant in, and only once that ride is CONFIRMED or COMPLETED —
 * sharing contact details at that point is an intentional product feature
 * so the two users can coordinate.
 */
export interface ContactUserDto extends PublicUserDto {
  email: string;
  phone: string | null;
  address: string | null;
}

/**
 * The authenticated user's own profile. Includes their own scores, which are
 * never exposed for other users.
 *
 * Deliberately omits: password, createdAt, updatedAt.
 */
export interface AuthUserDto extends ContactUserDto {
  karmaPoints: number;
  creditScore: number;
}

export function toPublicUser(user: ParticipantSource): PublicUserDto;
export function toPublicUser(
  user: ParticipantSource | null | undefined,
): PublicUserDto | null;
export function toPublicUser(
  user: ParticipantSource | null | undefined,
): PublicUserDto | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullname: user.fullname,
    role: user.role,
    profilePicture: user.profilePicture,
    ratings: user.ratings,
  };
}

export function toContactUser(user: ParticipantSource): ContactUserDto;
export function toContactUser(
  user: ParticipantSource | null | undefined,
): ContactUserDto | null;
export function toContactUser(
  user: ParticipantSource | null | undefined,
): ContactUserDto | null {
  if (!user) {
    return null;
  }

  return {
    ...toPublicUser(user),
    email: user.email,
    phone: user.phone,
    address: user.address,
  };
}

/**
 * Maps a user to either the public or the contact projection.
 * Callers pass the result of `canViewContactDetails` for the ride in question.
 */
export function toRideParticipant(
  user: ParticipantSource,
  includeContact: boolean,
): PublicUserDto | ContactUserDto;
export function toRideParticipant(
  user: ParticipantSource | null | undefined,
  includeContact: boolean,
): PublicUserDto | ContactUserDto | null;
export function toRideParticipant(
  user: ParticipantSource | null | undefined,
  includeContact: boolean,
): PublicUserDto | ContactUserDto | null {
  return includeContact ? toContactUser(user) : toPublicUser(user);
}

export function toAuthUser(user: User): AuthUserDto {
  return {
    ...toContactUser(user),
    karmaPoints: user.karmaPoints,
    creditScore: user.creditScore,
  };
}
