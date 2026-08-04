import { ForbiddenException, BadRequestException } from '@nestjs/common';

import { RIDE_STATUS } from '../constants/enums';

/**
 * Who is asking to change a ride's status.
 *
 * `system` is reserved for the scheduled expiry sweep, which acts on rides it
 * does not own.
 */
export enum RIDE_ACTOR {
  /** Created the ride row. */
  OWNER = 'owner',
  /** Assigned rider or passenger on a matched ride. */
  PARTICIPANT = 'participant',
  /** The scheduled sweep. */
  SYSTEM = 'system',
}

/** The identity fields a transition check needs from a ride. */
export interface RideActorContext {
  createdBy: number;
  riderId: number | null;
  passengerId: number | null;
}

interface Transition {
  from: readonly RIDE_STATUS[];
  by: readonly RIDE_ACTOR[];
  /** Shown to the user when the ride is not in a state that allows this. */
  rejection: string;
}

/**
 * Every legal status change in one place.
 *
 * Before this existed the rules were spread across five endpoints, and two of
 * them had no rules at all: reject and cancel updated whichever ride id was in
 * the URL, without checking who was asking or what state the ride was in, so
 * any authenticated user could cancel a stranger's confirmed ride.
 *
 * A transition is permitted only if the ride's current status appears in
 * `from` and the caller's relationship to the ride appears in `by`.
 */
export const RIDE_TRANSITIONS: Readonly<
  Partial<Record<RIDE_STATUS, Transition>>
> = {
  [RIDE_STATUS.CONFIRMED]: {
    from: [RIDE_STATUS.ACTIVE],
    by: [RIDE_ACTOR.OWNER],
    rejection: 'Only an active ride can be confirmed.',
  },
  [RIDE_STATUS.COMPLETED]: {
    from: [RIDE_STATUS.CONFIRMED],
    by: [RIDE_ACTOR.PARTICIPANT],
    rejection: 'Only a confirmed ride can be completed.',
  },
  [RIDE_STATUS.CANCELLED]: {
    // A confirmed ride may still be called off; a finished one may not.
    from: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED],
    by: [RIDE_ACTOR.OWNER, RIDE_ACTOR.PARTICIPANT],
    rejection: 'Only an active or confirmed ride can be cancelled.',
  },
  [RIDE_STATUS.REJECTED]: {
    from: [RIDE_STATUS.ACTIVE],
    by: [RIDE_ACTOR.OWNER],
    rejection: 'Only an active ride can be rejected.',
  },
  [RIDE_STATUS.EXPIRED]: {
    from: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED],
    by: [RIDE_ACTOR.SYSTEM],
    rejection: 'Only an active or confirmed ride can expire.',
  },
};

/**
 * Classifies a caller's relationship to a ride.
 *
 * Returns every role that applies: the creator of a matched ride is usually
 * also a participant, and either relationship may authorise a transition.
 */
export function actorsFor(
  ride: RideActorContext,
  userId: number,
): RIDE_ACTOR[] {
  const actors: RIDE_ACTOR[] = [];

  if (ride.createdBy === userId) {
    actors.push(RIDE_ACTOR.OWNER);
  }

  if (ride.riderId === userId || ride.passengerId === userId) {
    actors.push(RIDE_ACTOR.PARTICIPANT);
  }

  return actors;
}

export interface TransitionCheck {
  allowed: boolean;
  /** Set when the caller has no standing to act on this ride at all. */
  forbidden?: string;
  /** Set when the caller may act but the ride is in the wrong state. */
  invalid?: string;
}

/**
 * Decides whether `userId` may move `ride` to `target`.
 *
 * Distinguishes "not your ride" from "wrong state" so callers can answer 403
 * and 400 respectively rather than collapsing both into one error.
 */
export function checkTransition(
  ride: RideActorContext & { status: string },
  target: RIDE_STATUS,
  userId: number | null,
): TransitionCheck {
  const transition = RIDE_TRANSITIONS[target];

  if (!transition) {
    return { allowed: false, invalid: `Rides cannot be moved to ${target}.` };
  }

  const actors =
    userId === null ? [RIDE_ACTOR.SYSTEM] : actorsFor(ride, userId);
  const permitted = actors.some((actor) => transition.by.includes(actor));

  if (!permitted) {
    return {
      allowed: false,
      forbidden: 'You are not allowed to change this ride.',
    };
  }

  if (!transition.from.includes(ride.status as RIDE_STATUS)) {
    return { allowed: false, invalid: transition.rejection };
  }

  return { allowed: true };
}

/**
 * Throws the appropriate HTTP exception unless the transition is permitted.
 */
export function assertTransition(
  ride: RideActorContext & { status: string },
  target: RIDE_STATUS,
  userId: number | null,
): void {
  const result = checkTransition(ride, target, userId);

  if (result.allowed) {
    return;
  }

  if (result.forbidden) {
    throw new ForbiddenException(result.forbidden);
  }

  throw new BadRequestException(result.invalid);
}
