import { USER_ROLE } from '../constants/enums';
import { MAX_RIDE_PROXIMITY_KM } from '../utils/rideStats.util';
import {
  SEARCH_TIERS,
  boundingBox,
  oppositeRole,
  rankCandidates,
  scoreMatch,
} from './ride-matching.service';
import type { RideWithParticipants } from '../dto/ride-response.dto';

// Kathmandu, near the seeded coordinates.
const ORIGIN = { lat: 27.7172, lng: 85.324 };
/** ~1.1km east of ORIGIN; inside the base radius. */
const NEAR = { lat: 27.7172, lng: 85.335 };
/** ~11km east of ORIGIN; outside every tier below the widest. */
const FAR = { lat: 27.7172, lng: 85.435 };

const AT = new Date('2026-01-01T08:00:00.000Z');
const BASE_TIER = { radiusKm: MAX_RIDE_PROXIMITY_KM, windowMinutes: 5 };

function candidate(
  id: number,
  coords: { lat: number; lng: number } | null,
  overrides: { timestamp?: Date; ratings?: number | null } = {},
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
    timestamp: overrides.timestamp ?? AT,
    status: 'ACTIVE',
    createdBy: 1,
    riderId: 1,
    passengerId: null,
    estimatedTimeOfArrival: null,
    distance: null,
    co2Saved: null,
    peopleImpacted: null,
    rider: {
      id: 1,
      fullname: 'R',
      role: USER_ROLE.RIDER,
      profilePicture: null,
      ratings: overrides.ratings ?? null,
      email: 'r@example.com',
      phone: null,
      address: null,
    },
  } as unknown as RideWithParticipants;
}

describe('oppositeRole', () => {
  it('matches a rider with passengers and vice versa', () => {
    expect(oppositeRole(USER_ROLE.RIDER)).toBe(USER_ROLE.PASSENGER);
    expect(oppositeRole(USER_ROLE.PASSENGER)).toBe(USER_ROLE.RIDER);
  });
});

describe('boundingBox', () => {
  it('encloses the requested radius', () => {
    const box = boundingBox(ORIGIN.lat, ORIGIN.lng, 2);

    expect(box.minLat).toBeLessThan(ORIGIN.lat);
    expect(box.maxLat).toBeGreaterThan(ORIGIN.lat);
    expect(box.minLng).toBeLessThan(ORIGIN.lng);
    expect(box.maxLng).toBeGreaterThan(ORIGIN.lng);
  });

  it('widens in longitude as latitude increases', () => {
    // A degree of longitude covers less ground near the poles, so the box has
    // to span more degrees to cover the same distance.
    const equator = boundingBox(0, 0, 10);
    const northern = boundingBox(60, 0, 10);

    expect(northern.maxLng - northern.minLng).toBeGreaterThan(
      equator.maxLng - equator.minLng,
    );
  });

  it('stays finite at the pole', () => {
    const box = boundingBox(90, 0, 10);

    expect(Number.isFinite(box.minLng)).toBe(true);
    expect(Number.isFinite(box.maxLng)).toBe(true);
  });
});

describe('scoreMatch', () => {
  const base = {
    distanceKm: 0,
    radiusKm: 2,
    minutesApart: 0,
    windowMinutes: 5,
    rating: 5,
  };

  it('gives a perfect match the top score', () => {
    expect(scoreMatch(base)).toBeCloseTo(1, 5);
  });

  it('prefers the closer of two otherwise equal rides', () => {
    expect(scoreMatch({ ...base, distanceKm: 0.2 })).toBeGreaterThan(
      scoreMatch({ ...base, distanceKm: 1.8 }),
    );
  });

  it('prefers the nearer departure time', () => {
    expect(scoreMatch({ ...base, minutesApart: 1 })).toBeGreaterThan(
      scoreMatch({ ...base, minutesApart: 4 }),
    );
  });

  it('prefers the better-rated user', () => {
    expect(scoreMatch({ ...base, rating: 5 })).toBeGreaterThan(
      scoreMatch({ ...base, rating: 1 }),
    );
  });

  it('treats an unrated user as mid-scale, not worst', () => {
    // New accounts must remain matchable.
    expect(scoreMatch({ ...base, rating: null })).toBeGreaterThan(
      scoreMatch({ ...base, rating: 0 }),
    );
  });

  it('never leaves the 0..1 range', () => {
    const extreme = scoreMatch({
      distanceKm: 999,
      radiusKm: 2,
      minutesApart: 999,
      windowMinutes: 5,
      rating: 0,
    });

    expect(extreme).toBeGreaterThanOrEqual(0);
    expect(extreme).toBeLessThanOrEqual(1);
  });
});

describe('rankCandidates', () => {
  const query = { fromLat: ORIGIN.lat, fromLng: ORIGIN.lng, at: AT };

  it('keeps rides inside the radius', () => {
    const result = rankCandidates([candidate(1, NEAR)], query, BASE_TIER);

    expect(result).toHaveLength(1);
    expect(result[0].distance).toBeLessThanOrEqual(BASE_TIER.radiusKm);
  });

  it('drops rides that the bounding box let through but the circle excludes', () => {
    expect(rankCandidates([candidate(2, FAR)], query, BASE_TIER)).toEqual([]);
  });

  it('skips rides with no coordinates rather than throwing', () => {
    expect(rankCandidates([candidate(3, null)], query, BASE_TIER)).toEqual([]);
  });

  it('returns the best match first', () => {
    const result = rankCandidates(
      [
        candidate(10, { lat: 27.7172, lng: 85.3335 }), // ~1km away
        candidate(11, { lat: 27.7172, lng: 85.3255 }), // ~150m away
      ],
      query,
      BASE_TIER,
    );

    expect(result.map((r) => r.id)).toEqual([11, 10]);
  });

  it('ranks a punctual match above a distant-in-time one', () => {
    const result = rankCandidates(
      [
        candidate(20, NEAR, { timestamp: new Date(AT.getTime() + 4 * 60_000) }),
        candidate(21, NEAR, { timestamp: AT }),
      ],
      query,
      BASE_TIER,
    );

    expect(result[0].id).toBe(21);
  });

  it('attaches a positive ETA alongside the distance', () => {
    const [match] = rankCandidates([candidate(4, NEAR)], query, BASE_TIER);

    expect(match.distance).toBeGreaterThan(0);
    expect(match.estimatedTimeOfArrival).toBeGreaterThan(0);
  });

  it('does not mutate the rows it was given', () => {
    const input = candidate(6, NEAR);

    rankCandidates([input], query, BASE_TIER);

    expect(input.distance).toBeNull();
    expect(input.estimatedTimeOfArrival).toBeNull();
  });
});

describe('SEARCH_TIERS', () => {
  it('widens monotonically so each tier is a superset of the last', () => {
    for (let i = 1; i < SEARCH_TIERS.length; i++) {
      expect(SEARCH_TIERS[i].radiusKm).toBeGreaterThan(
        SEARCH_TIERS[i - 1].radiusKm,
      );
      expect(SEARCH_TIERS[i].windowMinutes).toBeGreaterThan(
        SEARCH_TIERS[i - 1].windowMinutes,
      );
    }
  });

  it('starts at the original fixed radius, so a dense area is unaffected', () => {
    expect(SEARCH_TIERS[0].radiusKm).toBe(MAX_RIDE_PROXIMITY_KM);
  });

  it('accepts at the widest tier a ride the base tier rejects', () => {
    const widest = SEARCH_TIERS[SEARCH_TIERS.length - 1];
    const query = { fromLat: ORIGIN.lat, fromLng: ORIGIN.lng, at: AT };

    expect(rankCandidates([candidate(30, FAR)], query, BASE_TIER)).toEqual([]);
    expect(
      rankCandidates([candidate(30, FAR)], query, widest).length,
    ).toBeGreaterThan(0);
  });
});
