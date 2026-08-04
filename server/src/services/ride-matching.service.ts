import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { PrismaService } from '../prisma.service';
import { USER_ROLE, RIDE_STATUS } from '../constants/enums';
import {
  RIDE_WITH_PARTICIPANTS_SELECT,
  RideWithParticipants,
} from '../dto/ride-response.dto';
import {
  calculateETA,
  haversineDistance,
  MAX_RIDE_PROXIMITY_KM,
} from '../utils/rideStats.util';
import { getTimeWindow } from '../utils/timeWindow.util';

export interface MatchQuery {
  fromLat: number;
  fromLng: number;
  timestamp: string;
  role: USER_ROLE;
}

/** A candidate ride with the distance, ETA and ranking computed for a searcher. */
export type MatchedRide = RideWithParticipants & {
  distance: number;
  estimatedTimeOfArrival: number;
  score: number;
};

/** Kilometres per degree of latitude; near enough anywhere on Earth. */
const KM_PER_DEGREE_LAT = 111.045;

/**
 * How far the search relaxes when nothing turns up.
 *
 * A single fixed window is unforgiving in a thin market: a commuter five
 * minutes outside it, or two kilometres past the radius, simply never matches.
 * Each tier is tried in turn and the search stops at the first that yields
 * anything, so a dense area still gets the tightest possible match.
 */
export const SEARCH_TIERS: readonly {
  radiusKm: number;
  windowMinutes: number;
}[] = [
  { radiusKm: MAX_RIDE_PROXIMITY_KM, windowMinutes: 5 },
  { radiusKm: MAX_RIDE_PROXIMITY_KM * 2, windowMinutes: 15 },
  { radiusKm: MAX_RIDE_PROXIMITY_KM * 4, windowMinutes: 30 },
];

/** Relative influence of each signal on the ranking. They sum to 1. */
export const SCORE_WEIGHTS = {
  proximity: 0.5,
  punctuality: 0.3,
  rating: 0.2,
} as const;

/** Ratings run 0-5; used to normalise an absent rating to a neutral value. */
const MAX_RATING = 5;

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * A latitude/longitude box guaranteed to contain every point within
 * `radiusKm` of the origin.
 *
 * Deliberately generous: a box that circumscribes the circle may include
 * corners slightly outside it, which is why the exact great-circle distance
 * still filters the shortlist afterwards. Longitude degrees narrow towards the
 * poles, hence the cosine term.
 */
export function boundingBox(
  lat: number,
  lng: number,
  radiusKm: number,
): BoundingBox {
  const deltaLat = radiusKm / KM_PER_DEGREE_LAT;
  // Guard the pole case, where a degree of longitude collapses to nothing.
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
  const deltaLng = radiusKm / (KM_PER_DEGREE_LAT * cosLat);

  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLng: lng - deltaLng,
    maxLng: lng + deltaLng,
  };
}

/**
 * Ranks a candidate between 0 and 1, higher being a better match.
 *
 * Previously the endpoint returned everything inside the radius in whatever
 * order the database produced, leaving the rider to guess. Three signals go
 * into the ranking: how close the other party is, how near in time their
 * departure sits, and how well they have been rated.
 */
export function scoreMatch(input: {
  distanceKm: number;
  radiusKm: number;
  minutesApart: number;
  windowMinutes: number;
  rating: number | null;
}): number {
  const proximity = 1 - Math.min(input.distanceKm / input.radiusKm, 1);
  const punctuality =
    1 - Math.min(input.minutesApart / Math.max(input.windowMinutes, 1), 1);
  // An unrated user sits mid-scale rather than last: new accounts should not
  // be unmatchable.
  const rating = (input.rating ?? MAX_RATING / 2) / MAX_RATING;

  return (
    SCORE_WEIGHTS.proximity * proximity +
    SCORE_WEIGHTS.punctuality * punctuality +
    SCORE_WEIGHTS.rating * Math.min(Math.max(rating, 0), 1)
  );
}

/**
 * Refines a bounding-box shortlist to true circular proximity, attaching the
 * distance, ETA and score each candidate earns for this searcher.
 *
 * Pure, so the geometry and ranking are testable without a database.
 */
export function rankCandidates<T extends RideWithParticipants>(
  candidates: T[],
  query: { fromLat: number; fromLng: number; at: Date },
  tier: { radiusKm: number; windowMinutes: number },
): (T & { distance: number; estimatedTimeOfArrival: number; score: number })[] {
  const ranked: (T & {
    distance: number;
    estimatedTimeOfArrival: number;
    score: number;
  })[] = [];

  for (const ride of candidates) {
    if (!Number.isFinite(ride.fromLat) || !Number.isFinite(ride.fromLng)) {
      continue;
    }

    const distance = haversineDistance(
      query.fromLat,
      query.fromLng,
      ride.fromLat as number,
      ride.fromLng as number,
    );

    if (distance > tier.radiusKm) {
      continue;
    }

    const minutesApart =
      Math.abs(ride.timestamp.getTime() - query.at.getTime()) / 60_000;

    ranked.push({
      ...ride,
      distance,
      estimatedTimeOfArrival: calculateETA(distance),
      score: scoreMatch({
        distanceKm: distance,
        radiusKm: tier.radiusKm,
        minutesApart,
        windowMinutes: tier.windowMinutes,
        rating: ride.rider?.ratings ?? ride.createdByUser?.ratings ?? null,
      }),
    });
  }

  return ranked.sort((a, b) => b.score - a.score);
}

/** A rider is matched with passengers and vice versa. */
export function oppositeRole(role: USER_ROLE): USER_ROLE {
  return role === USER_ROLE.RIDER ? USER_ROLE.PASSENGER : USER_ROLE.RIDER;
}

@Injectable()
export class RideMatchingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  /**
   * Finds and ranks rides of the opposite role near the searcher.
   *
   * Widens through {@link SEARCH_TIERS} until something matches, so the search
   * degrades gracefully in quiet areas instead of returning nothing.
   */
  async findMatches(query: MatchQuery): Promise<MatchedRide[]> {
    const at = new Date(query.timestamp);

    for (const tier of SEARCH_TIERS) {
      const matches = await this.searchTier(query, at, tier);

      if (matches.length > 0) {
        this.logger.log({
          level: 'info',
          message: `Matched rides for role=${query.role}`,
          tag: 'ride',
          role: query.role,
          radiusKm: tier.radiusKm,
          windowMinutes: tier.windowMinutes,
          matchedCount: matches.length,
        });

        return matches;
      }
    }

    this.logger.log({
      level: 'info',
      message: `No rides matched even at the widest tier`,
      tag: 'ride',
      role: query.role,
    });

    return [];
  }

  private async searchTier(
    query: MatchQuery,
    at: Date,
    tier: { radiusKm: number; windowMinutes: number },
  ): Promise<MatchedRide[]> {
    const { min, max } = getTimeWindow(query.timestamp, tier.windowMinutes);
    const box = boundingBox(query.fromLat, query.fromLng, tier.radiusKm);

    // The bounding box is applied by the database through a GiST index, so the
    // rows crossing the wire scale with local density rather than with the
    // total number of open rides.
    const ids = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "Ride"
      WHERE "role"::text = ${oppositeRole(query.role)}
        AND "status"::text = ${RIDE_STATUS.ACTIVE}
        AND "timestamp" >= ${min.toISOString()}::timestamp
        AND "timestamp" <= ${max.toISOString()}::timestamp
        AND "fromLat" IS NOT NULL
        AND "fromLng" IS NOT NULL
        AND point("fromLng", "fromLat") <@ box(
              point(${box.minLng}::float8, ${box.minLat}::float8),
              point(${box.maxLng}::float8, ${box.maxLat}::float8)
            )
    `;

    if (ids.length === 0) {
      return [];
    }

    const candidates = await this.prisma.ride.findMany({
      where: { id: { in: ids.map((row) => row.id) } },
      select: RIDE_WITH_PARTICIPANTS_SELECT,
    });

    return rankCandidates(
      candidates,
      { fromLat: query.fromLat, fromLng: query.fromLng, at },
      tier,
    );
  }
}
