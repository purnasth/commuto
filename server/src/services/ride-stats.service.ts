import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { USER_ROLE } from '../constants/enums';

/**
 * Totals shown on the reflection dashboard.
 *
 * These used to be derived in the browser by reducing the entire ride history
 * array, which is why history could not be paginated: fetching one page would
 * have silently changed every total. Computing them in SQL decouples the two.
 */
export interface RideStats {
  postedCount: number;
  completedCount: number;
  distanceTravelled: number;
  co2Reduced: number;
  peopleImpacted: number;
}

/** Shape returned by the aggregate query; COUNT/SUM arrive as bigint or null. */
interface StatsRow {
  rider_posted: bigint;
  passenger_posted: bigint;
  rider_completed: bigint;
  passenger_completed: bigint;
  rider_distance: number | null;
  passenger_distance: number | null;
  rider_co2: number | null;
  passenger_co2: number | null;
}

@Injectable()
export class RideStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates a user's ride totals in a single query.
   *
   * A matched trip is stored as two rows sharing a `matchGroupId`, so the CTE
   * collapses each group to one row before counting -- mirroring the
   * deduplication the history endpoint performs, so the totals and the list
   * agree. Rides with no group fall back to their own id as the key, which
   * keeps them distinct from each other (a plain DISTINCT ON matchGroupId
   * would treat every NULL as the same group and collapse them all).
   */
  async getStatsForUser(userId: number, role: USER_ROLE): Promise<RideStats> {
    const rows = await this.prisma.$queryRaw<StatsRow[]>`
      WITH involved AS (
        SELECT DISTINCT ON (COALESCE("matchGroupId", 'ride_' || "id"))
               "id", "status", "distance", "co2Saved", "riderId", "passengerId"
        FROM "Ride"
        WHERE "riderId" = ${userId}
           OR "passengerId" = ${userId}
           OR "createdBy" = ${userId}
        ORDER BY COALESCE("matchGroupId", 'ride_' || "id"), "timestamp" DESC
      )
      SELECT
        COUNT(*) FILTER (WHERE "riderId" = ${userId})     AS rider_posted,
        COUNT(*) FILTER (WHERE "passengerId" = ${userId}) AS passenger_posted,
        COUNT(*) FILTER (
          WHERE "riderId" = ${userId} AND "status"::text = 'COMPLETED'
        ) AS rider_completed,
        COUNT(*) FILTER (
          WHERE "passengerId" = ${userId} AND "status"::text = 'COMPLETED'
        ) AS passenger_completed,
        SUM("distance") FILTER (
          WHERE "riderId" = ${userId} AND "status"::text = 'COMPLETED'
        ) AS rider_distance,
        SUM("distance") FILTER (
          WHERE "passengerId" = ${userId} AND "status"::text = 'COMPLETED'
        ) AS passenger_distance,
        SUM("co2Saved") FILTER (
          WHERE "riderId" = ${userId} AND "status"::text = 'COMPLETED'
        ) AS rider_co2,
        SUM("co2Saved") FILTER (
          WHERE "passengerId" = ${userId} AND "status"::text = 'COMPLETED'
        ) AS passenger_co2
      FROM involved
    `;

    const row = rows[0];

    if (!row) {
      return {
        postedCount: 0,
        completedCount: 0,
        distanceTravelled: 0,
        co2Reduced: 0,
        peopleImpacted: 0,
      };
    }

    const isRider = role === USER_ROLE.RIDER;
    const completedCount = Number(
      isRider ? row.rider_completed : row.passenger_completed,
    );

    return {
      postedCount: Number(isRider ? row.rider_posted : row.passenger_posted),
      completedCount,
      distanceTravelled: Number(
        (isRider ? row.rider_distance : row.passenger_distance) ?? 0,
      ),
      co2Reduced: Number((isRider ? row.rider_co2 : row.passenger_co2) ?? 0),
      // One counterparty per completed trip, matching the single-passenger
      // assumption the rest of the app makes.
      peopleImpacted: completedCount,
    };
  }
}
