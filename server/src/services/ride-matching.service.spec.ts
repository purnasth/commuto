import { USER_ROLE } from '../constants/enums';
import { MAX_RIDE_PROXIMITY_KM } from '../utils/rideStats.util';
import { oppositeRole, withinProximity } from './ride-matching.service';
import type { RideWithParticipants } from '../dto/ride-response.dto';

// Kathmandu, near the seeded coordinates.
const ORIGIN = { lat: 27.7172, lng: 85.324 };

/** ~1.1km east of ORIGIN; well inside the proximity limit. */
const NEAR = { lat: 27.7172, lng: 85.335 };
/** ~11km east of ORIGIN; well outside it. */
const FAR = { lat: 27.7172, lng: 85.435 };

function candidate(
  id: number,
  coords: { lat: number; lng: number } | null,
): RideWithParticipants {
  return {
    id,
    from: 'A',
    fromLat: coords?.lat ?? null,
    fromLng: coords?.lng ?? null,
    to: 'B',
    toLat: null,
    toLng: null,
    message: null,
    role: USER_ROLE.RIDER,
    timestamp: new Date('2026-01-01T00:00:00.000Z'),
    status: 'ACTIVE',
    createdBy: 1,
    riderId: 1,
    passengerId: null,
    estimatedTimeOfArrival: null,
    distance: null,
    co2Saved: null,
    peopleImpacted: null,
  } as unknown as RideWithParticipants;
}

describe('oppositeRole', () => {
  it('matches a rider with passengers and vice versa', () => {
    expect(oppositeRole(USER_ROLE.RIDER)).toBe(USER_ROLE.PASSENGER);
    expect(oppositeRole(USER_ROLE.PASSENGER)).toBe(USER_ROLE.RIDER);
  });
});

describe('withinProximity', () => {
  it('keeps rides inside the proximity limit', () => {
    const result = withinProximity(
      [candidate(1, NEAR)],
      ORIGIN.lat,
      ORIGIN.lng,
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].distance).toBeLessThanOrEqual(MAX_RIDE_PROXIMITY_KM);
  });

  it('drops rides beyond the limit', () => {
    expect(
      withinProximity([candidate(2, FAR)], ORIGIN.lat, ORIGIN.lng),
    ).toEqual([]);
  });

  it('skips rides with no coordinates rather than throwing', () => {
    expect(
      withinProximity([candidate(3, null)], ORIGIN.lat, ORIGIN.lng),
    ).toEqual([]);
  });

  it('attaches a positive ETA alongside the distance', () => {
    const [match] = withinProximity(
      [candidate(4, NEAR)],
      ORIGIN.lat,
      ORIGIN.lng,
    );

    expect(match.distance).toBeGreaterThan(0);
    expect(match.estimatedTimeOfArrival).toBeGreaterThan(0);
  });

  it('reports zero distance when the origins coincide', () => {
    const [match] = withinProximity(
      [candidate(5, ORIGIN)],
      ORIGIN.lat,
      ORIGIN.lng,
    );

    expect(match.distance).toBeCloseTo(0, 5);
  });

  it('does not mutate the rows it was given', () => {
    // The previous implementation assigned distance and ETA onto the Prisma
    // objects from inside a filter predicate.
    const input = candidate(6, NEAR);

    withinProximity([input], ORIGIN.lat, ORIGIN.lng);

    expect(input.distance).toBeNull();
    expect(input.estimatedTimeOfArrival).toBeNull();
  });

  it('keeps only the near ride out of a mixed set', () => {
    const result = withinProximity(
      [candidate(7, FAR), candidate(8, NEAR), candidate(9, null)],
      ORIGIN.lat,
      ORIGIN.lng,
    );

    expect(result.map((r) => r.id)).toEqual([8]);
  });
});
