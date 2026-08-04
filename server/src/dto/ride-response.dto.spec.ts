import { Ride, User } from 'generated/prisma';

import { RIDE_STATUS, USER_ROLE } from '../constants/enums';

import {
  canViewContactDetails,
  toRideDto,
  RideWithParticipants,
} from './ride-response.dto';
import { PublicUserDto, toAuthUser, toPublicUser } from './user-response.dto';

/** Every field on User that must never reach another user. */
const SECRET_USER_FIELDS = [
  'password',
  'createdAt',
  'updatedAt',
  'karmaPoints',
  'creditScore',
] as const;

const CONTACT_FIELDS = ['email', 'phone', 'address'] as const;

const RIDER_ID = 1;
const PASSENGER_ID = 2;
const STRANGER_ID = 99;

function makeUser(id: number, name: string): User {
  return {
    id,
    fullname: name,
    email: `${name}@example.com`,
    password: '$2b$10$averysecretbcrypthashthatmustnevergoout',
    role: USER_ROLE.RIDER,
    phone: '9800000000',
    address: 'Kathmandu',
    profilePicture: null,
    ratings: 4.5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    karmaPoints: 500,
    creditScore: 300,
  } as User;
}

function makeRide(status: string): RideWithParticipants {
  return {
    id: 10,
    from: 'A',
    fromLat: 27.7,
    fromLng: 85.3,
    to: 'B',
    toLat: 27.8,
    toLng: 85.4,
    message: 'hi',
    role: USER_ROLE.RIDER,
    timestamp: new Date('2024-06-01'),
    status,
    createdBy: RIDER_ID,
    riderId: RIDER_ID,
    passengerId: PASSENGER_ID,
    estimatedTimeOfArrival: 12,
    distance: 3.2,
    co2Saved: 0.5,
    peopleImpacted: 1,
    matchGroupId: 'internal-match-group-uuid',
    rider: makeUser(RIDER_ID, 'rider'),
    createdByUser: makeUser(RIDER_ID, 'rider'),
    passengers: [makeUser(PASSENGER_ID, 'passenger')],
  } as unknown as RideWithParticipants;
}

/** Collects every participant object in a mapped ride response. */
function participantsOf(dto: ReturnType<typeof toRideDto>): PublicUserDto[] {
  return [dto.rider, dto.createdByUser, ...(dto.passengers ?? [])].filter(
    (participant): participant is PublicUserDto => Boolean(participant),
  );
}

describe('toPublicUser', () => {
  it('never exposes secret fields', () => {
    const dto = toPublicUser(makeUser(RIDER_ID, 'rider'));

    for (const field of [...SECRET_USER_FIELDS, ...CONTACT_FIELDS]) {
      expect(dto).not.toHaveProperty(field);
    }
    expect(dto).toEqual({
      id: RIDER_ID,
      fullname: 'rider',
      role: USER_ROLE.RIDER,
      profilePicture: null,
      ratings: 4.5,
    });
  });
});

describe('toAuthUser', () => {
  it('returns the caller their own profile without password or timestamps', () => {
    const dto = toAuthUser(makeUser(RIDER_ID, 'rider'));

    expect(dto).not.toHaveProperty('password');
    expect(dto).not.toHaveProperty('createdAt');
    expect(dto).not.toHaveProperty('updatedAt');
    // Own scores and contact details are the caller's to see.
    expect(dto.karmaPoints).toBe(500);
    expect(dto.email).toBe('rider@example.com');
  });
});

describe('canViewContactDetails', () => {
  const confirmed = makeRide(RIDE_STATUS.CONFIRMED);

  it('denies anonymous viewers', () => {
    expect(canViewContactDetails(confirmed, undefined)).toBe(false);
    expect(canViewContactDetails(confirmed, null)).toBe(false);
  });

  it('denies authenticated non-participants', () => {
    expect(canViewContactDetails(confirmed, STRANGER_ID)).toBe(false);
  });

  it('denies participants while the ride is not yet matched', () => {
    expect(canViewContactDetails(makeRide(RIDE_STATUS.ACTIVE), RIDER_ID)).toBe(
      false,
    );
  });

  it('allows participants on confirmed and completed rides', () => {
    expect(canViewContactDetails(confirmed, RIDER_ID)).toBe(true);
    expect(canViewContactDetails(confirmed, PASSENGER_ID)).toBe(true);
    expect(
      canViewContactDetails(makeRide(RIDE_STATUS.COMPLETED), PASSENGER_ID),
    ).toBe(true);
  });
});

describe('toRideDto', () => {
  it('never leaks password or internal user fields, whoever is asking', () => {
    const viewers = [undefined, STRANGER_ID, RIDER_ID, PASSENGER_ID];
    const statuses = [
      RIDE_STATUS.ACTIVE,
      RIDE_STATUS.CONFIRMED,
      RIDE_STATUS.COMPLETED,
    ];

    for (const status of statuses) {
      for (const viewer of viewers) {
        const dto = toRideDto(makeRide(status), viewer);

        for (const participant of participantsOf(dto)) {
          for (const field of SECRET_USER_FIELDS) {
            expect(participant).not.toHaveProperty(field);
          }
        }
      }
    }
  });

  it('hides contact details from an anonymous viewer on a confirmed ride', () => {
    const dto = toRideDto(makeRide(RIDE_STATUS.CONFIRMED));

    for (const participant of participantsOf(dto)) {
      for (const field of CONTACT_FIELDS) {
        expect(participant).not.toHaveProperty(field);
      }
    }
  });

  it('hides contact details from a stranger on a confirmed ride', () => {
    const dto = toRideDto(makeRide(RIDE_STATUS.CONFIRMED), STRANGER_ID);

    for (const participant of participantsOf(dto)) {
      for (const field of CONTACT_FIELDS) {
        expect(participant).not.toHaveProperty(field);
      }
    }
  });

  it('hides contact details on an active ride even from its creator', () => {
    const dto = toRideDto(makeRide(RIDE_STATUS.ACTIVE), RIDER_ID);

    for (const participant of participantsOf(dto)) {
      for (const field of CONTACT_FIELDS) {
        expect(participant).not.toHaveProperty(field);
      }
    }
  });

  it('shares contact details between participants of a confirmed ride', () => {
    const dto = toRideDto(makeRide(RIDE_STATUS.CONFIRMED), PASSENGER_ID);

    expect(dto.rider).toMatchObject({
      email: 'rider@example.com',
      phone: '9800000000',
      address: 'Kathmandu',
    });
  });

  it('omits the internal matchGroupId', () => {
    expect(
      toRideDto(makeRide(RIDE_STATUS.CONFIRMED), RIDER_ID),
    ).not.toHaveProperty('matchGroupId');
  });

  it('keeps relations absent when they were not included in the query', () => {
    const ride = makeRide(RIDE_STATUS.ACTIVE);
    delete ride.rider;
    delete ride.passengers;

    const dto = toRideDto(ride, RIDER_ID);

    expect(dto).not.toHaveProperty('rider');
    expect(dto).not.toHaveProperty('passengers');
    expect(dto).toHaveProperty('createdByUser');
  });

  it('preserves a null rider on a ride with no rider assigned', () => {
    const ride = makeRide(RIDE_STATUS.ACTIVE);
    ride.rider = null;

    expect(toRideDto(ride, RIDER_ID).rider).toBeNull();
  });

  it('carries through the ride fields the app renders', () => {
    const dto = toRideDto(makeRide(RIDE_STATUS.COMPLETED), RIDER_ID);

    expect(dto).toMatchObject({
      id: 10,
      from: 'A',
      to: 'B',
      status: RIDE_STATUS.COMPLETED,
      estimatedTimeOfArrival: 12,
      distance: 3.2,
      co2Saved: 0.5,
      peopleImpacted: 1,
      riderId: RIDER_ID,
      passengerId: PASSENGER_ID,
      createdBy: RIDER_ID,
    });
  });
});

// Guards against a future `include` quietly re-introducing a raw Prisma user.
describe('serialized response', () => {
  it('contains no bcrypt hash anywhere in the JSON', () => {
    const json = JSON.stringify(
      toRideDto(makeRide(RIDE_STATUS.CONFIRMED), RIDER_ID),
    );

    expect(json).not.toContain('$2b$');
    expect(json).not.toContain('averysecretbcrypthash');
  });
});

// Ride objects are only ever mapped, never spread from Prisma, so a new
// sensitive column added to the User model cannot leak by default.
describe('unknown future columns', () => {
  it('drops fields the DTO does not name', () => {
    const ride = makeRide(RIDE_STATUS.CONFIRMED);
    (ride.rider as User & { ssn?: string }).ssn = 'should-not-appear';
    (ride as Ride & { secretColumn?: string }).secretColumn = 'nope';

    const dto = toRideDto(ride, RIDER_ID);

    expect(dto.rider).not.toHaveProperty('ssn');
    expect(dto).not.toHaveProperty('secretColumn');
  });
});
