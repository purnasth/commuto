import { ForbiddenException, BadRequestException } from '@nestjs/common';

import { RIDE_STATUS } from '../constants/enums';
import {
  RIDE_ACTOR,
  actorsFor,
  assertTransition,
  checkTransition,
} from './ride-lifecycle';

const OWNER = 1;
const RIDER = 1;
const PASSENGER = 2;
const STRANGER = 99;

/** A matched ride: created by the rider, with both participants assigned. */
function ride(status: RIDE_STATUS, overrides = {}) {
  return {
    status,
    createdBy: OWNER,
    riderId: RIDER,
    passengerId: PASSENGER,
    ...overrides,
  };
}

/** An unmatched posting: no counterparty assigned yet. */
function posting(status: RIDE_STATUS) {
  return { status, createdBy: OWNER, riderId: RIDER, passengerId: null };
}

describe('actorsFor', () => {
  it('recognises the creator as owner', () => {
    expect(actorsFor(ride(RIDE_STATUS.ACTIVE), OWNER)).toContain(
      RIDE_ACTOR.OWNER,
    );
  });

  it('recognises the assigned passenger as a participant', () => {
    expect(actorsFor(ride(RIDE_STATUS.CONFIRMED), PASSENGER)).toEqual([
      RIDE_ACTOR.PARTICIPANT,
    ]);
  });

  it('gives an unrelated user no standing at all', () => {
    expect(actorsFor(ride(RIDE_STATUS.CONFIRMED), STRANGER)).toEqual([]);
  });

  it('reports both roles when the creator is also a participant', () => {
    expect(actorsFor(ride(RIDE_STATUS.CONFIRMED), RIDER)).toEqual([
      RIDE_ACTOR.OWNER,
      RIDE_ACTOR.PARTICIPANT,
    ]);
  });
});

describe('confirm', () => {
  it('is allowed for the owner of an active ride', () => {
    expect(
      checkTransition(posting(RIDE_STATUS.ACTIVE), RIDE_STATUS.CONFIRMED, OWNER)
        .allowed,
    ).toBe(true);
  });

  it('is refused once the ride is already confirmed', () => {
    const result = checkTransition(
      ride(RIDE_STATUS.CONFIRMED),
      RIDE_STATUS.CONFIRMED,
      OWNER,
    );

    expect(result.allowed).toBe(false);
    expect(result.invalid).toMatch(/active/i);
  });

  it('is refused for a stranger', () => {
    const result = checkTransition(
      posting(RIDE_STATUS.ACTIVE),
      RIDE_STATUS.CONFIRMED,
      STRANGER,
    );

    expect(result.allowed).toBe(false);
    expect(result.forbidden).toBeDefined();
  });
});

describe('complete', () => {
  it('is allowed for either participant of a confirmed ride', () => {
    for (const actor of [RIDER, PASSENGER]) {
      expect(
        checkTransition(
          ride(RIDE_STATUS.CONFIRMED),
          RIDE_STATUS.COMPLETED,
          actor,
        ).allowed,
      ).toBe(true);
    }
  });

  it('is refused while the ride is still active', () => {
    const result = checkTransition(
      ride(RIDE_STATUS.ACTIVE),
      RIDE_STATUS.COMPLETED,
      RIDER,
    );

    expect(result.allowed).toBe(false);
    expect(result.invalid).toMatch(/confirmed/i);
  });

  it('cannot be completed twice', () => {
    expect(
      checkTransition(ride(RIDE_STATUS.COMPLETED), RIDE_STATUS.COMPLETED, RIDER)
        .allowed,
    ).toBe(false);
  });

  it('is refused for a stranger', () => {
    expect(
      checkTransition(
        ride(RIDE_STATUS.CONFIRMED),
        RIDE_STATUS.COMPLETED,
        STRANGER,
      ).forbidden,
    ).toBeDefined();
  });
});

// These two endpoints previously performed no checks whatsoever.
describe('cancel', () => {
  it('is refused for a stranger', () => {
    const result = checkTransition(
      ride(RIDE_STATUS.CONFIRMED),
      RIDE_STATUS.CANCELLED,
      STRANGER,
    );

    expect(result.allowed).toBe(false);
    expect(result.forbidden).toBeDefined();
  });

  it('is allowed for a participant of a confirmed ride', () => {
    expect(
      checkTransition(
        ride(RIDE_STATUS.CONFIRMED),
        RIDE_STATUS.CANCELLED,
        PASSENGER,
      ).allowed,
    ).toBe(true);
  });

  it('cannot undo a completed ride', () => {
    const result = checkTransition(
      ride(RIDE_STATUS.COMPLETED),
      RIDE_STATUS.CANCELLED,
      RIDER,
    );

    expect(result.allowed).toBe(false);
    expect(result.invalid).toBeDefined();
  });

  it('cannot re-cancel an already cancelled ride', () => {
    expect(
      checkTransition(ride(RIDE_STATUS.CANCELLED), RIDE_STATUS.CANCELLED, RIDER)
        .allowed,
    ).toBe(false);
  });
});

describe('reject', () => {
  it('is refused for a stranger', () => {
    expect(
      checkTransition(
        posting(RIDE_STATUS.ACTIVE),
        RIDE_STATUS.REJECTED,
        STRANGER,
      ).forbidden,
    ).toBeDefined();
  });

  it('is refused once the ride is confirmed', () => {
    expect(
      checkTransition(ride(RIDE_STATUS.CONFIRMED), RIDE_STATUS.REJECTED, OWNER)
        .allowed,
    ).toBe(false);
  });
});

describe('expire', () => {
  it('is allowed for the system sweep', () => {
    expect(
      checkTransition(ride(RIDE_STATUS.ACTIVE), RIDE_STATUS.EXPIRED, null)
        .allowed,
    ).toBe(true);
  });

  it('is not something a user can trigger', () => {
    expect(
      checkTransition(ride(RIDE_STATUS.ACTIVE), RIDE_STATUS.EXPIRED, OWNER)
        .forbidden,
    ).toBeDefined();
  });

  it('does not expire a finished ride', () => {
    expect(
      checkTransition(ride(RIDE_STATUS.COMPLETED), RIDE_STATUS.EXPIRED, null)
        .allowed,
    ).toBe(false);
  });
});

describe('terminal states', () => {
  const terminal = [
    RIDE_STATUS.COMPLETED,
    RIDE_STATUS.CANCELLED,
    RIDE_STATUS.REJECTED,
    RIDE_STATUS.EXPIRED,
  ];
  const targets = [
    RIDE_STATUS.CONFIRMED,
    RIDE_STATUS.COMPLETED,
    RIDE_STATUS.CANCELLED,
    RIDE_STATUS.REJECTED,
  ];

  it('never allows leaving a terminal state', () => {
    for (const from of terminal) {
      for (const target of targets) {
        expect(checkTransition(ride(from), target, RIDER).allowed).toBe(false);
      }
    }
  });
});

describe('assertTransition', () => {
  it('throws Forbidden when the caller has no standing', () => {
    expect(() =>
      assertTransition(
        ride(RIDE_STATUS.CONFIRMED),
        RIDE_STATUS.CANCELLED,
        STRANGER,
      ),
    ).toThrow(ForbiddenException);
  });

  it('throws BadRequest when the state is wrong', () => {
    expect(() =>
      assertTransition(
        ride(RIDE_STATUS.COMPLETED),
        RIDE_STATUS.CANCELLED,
        RIDER,
      ),
    ).toThrow(BadRequestException);
  });

  it('stays silent on a legal transition', () => {
    expect(() =>
      assertTransition(
        ride(RIDE_STATUS.CONFIRMED),
        RIDE_STATUS.COMPLETED,
        RIDER,
      ),
    ).not.toThrow();
  });
});
