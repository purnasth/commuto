import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { PrismaService } from '../prisma.service';
import {
  USER_ROLE,
  RIDE_STATUS,
  RIDE_MATCH_WINDOW_MINUTES,
} from '../constants/enums';
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

/** A candidate ride with the distance and ETA computed for this searcher. */
export type MatchedRide = RideWithParticipants & {
  distance: number;
  estimatedTimeOfArrival: number;
};

/**
 * Narrows candidates to those within the proximity limit, attaching the
 * distance and ETA relative to the searcher's origin.
 *
 * Kept as a pure function so the geometry can be tested without a database.
 * The previous version mutated the Prisma rows in place inside a `filter`
 * callback, which made the distance a side effect of the predicate.
 */
export function withinProximity<T extends RideWithParticipants>(
  rides: T[],
  fromLat: number,
  fromLng: number,
): (T & { distance: number; estimatedTimeOfArrival: number })[] {
  const matched: (T & {
    distance: number;
    estimatedTimeOfArrival: number;
  })[] = [];

  for (const ride of rides) {
    if (!Number.isFinite(ride.fromLat) || !Number.isFinite(ride.fromLng)) {
      continue;
    }

    const distance = haversineDistance(
      fromLat,
      fromLng,
      ride.fromLat as number,
      ride.fromLng as number,
    );

    if (distance > MAX_RIDE_PROXIMITY_KM) {
      continue;
    }

    matched.push({
      ...ride,
      distance,
      estimatedTimeOfArrival: calculateETA(distance),
    });
  }

  return matched;
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
   * Finds active rides of the opposite role near the searcher, inside the
   * matching time window.
   *
   * Proximity is still measured in application code after the database has
   * narrowed by role, status and time. Moving that predicate into an indexed
   * spatial query is the P2 work; this keeps the behaviour identical while
   * making it callable and testable outside a request.
   */
  async findMatches(query: MatchQuery): Promise<MatchedRide[]> {
    const { min: minTime, max: maxTime } = getTimeWindow(
      query.timestamp,
      RIDE_MATCH_WINDOW_MINUTES,
    );

    const candidates = await this.prisma.ride.findMany({
      where: {
        role: oppositeRole(query.role),
        status: RIDE_STATUS.ACTIVE,
        timestamp: { gte: minTime, lte: maxTime },
        fromLat: { not: null },
        fromLng: { not: null },
      },
      select: RIDE_WITH_PARTICIPANTS_SELECT,
    });

    const matches = withinProximity(candidates, query.fromLat, query.fromLng);

    this.logger.log({
      level: 'info',
      message: `Matched rides for role=${query.role}`,
      tag: 'ride',
      role: query.role,
      timestamp: query.timestamp,
      candidateCount: candidates.length,
      matchedCount: matches.length,
    });

    return matches;
  }
}
