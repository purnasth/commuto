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

/** COUNT/SUM arrive as bigint or null from Postgres. */
interface PostedRow {
  rider_posted: bigint;
  passenger_posted: bigint;
}

interface CompletedRow {
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
   * Aggregates a user's totals in two queries.
   *
   * Completed journeys are counted from `Trip`, which already holds one row
   * each; the old version had to collapse pairs of Ride rows sharing a
   * `matchGroupId` first. Postings are still counted from `Ride`, because an
   * unmatched posting never becomes a Trip and would otherwise vanish from
   * the total.
   */
  async getStatsForUser(userId: number, role: USER_ROLE): Promise<RideStats> {
    // Postings: every ride the user put up, matched or not. A matched pair
    // still contributes one row per side, and only the user's own side counts.
    const posted = await this.prisma.$queryRaw<PostedRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE "riderId" = ${userId})     AS rider_posted,
        COUNT(*) FILTER (WHERE "passengerId" = ${userId}) AS passenger_posted
      FROM (
        SELECT DISTINCT ON (COALESCE("matchGroupId", 'ride_' || "id"))
               "riderId", "passengerId"
        FROM "Ride"
        WHERE "riderId" = ${userId}
           OR "passengerId" = ${userId}
           OR "createdBy" = ${userId}
        ORDER BY COALESCE("matchGroupId", 'ride_' || "id"), "timestamp" DESC
      ) postings
    `;

    // Completed journeys: one Trip row each, so a plain aggregate.
    const completed = await this.prisma.$queryRaw<CompletedRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE "riderId" = ${userId})     AS rider_completed,
        COUNT(*) FILTER (WHERE "passengerId" = ${userId}) AS passenger_completed,
        SUM("distance") FILTER (WHERE "riderId" = ${userId})     AS rider_distance,
        SUM("distance") FILTER (WHERE "passengerId" = ${userId}) AS passenger_distance,
        SUM("co2Saved") FILTER (WHERE "riderId" = ${userId})     AS rider_co2,
        SUM("co2Saved") FILTER (WHERE "passengerId" = ${userId}) AS passenger_co2
      FROM "Trip"
      WHERE "status"::text = 'COMPLETED'
        AND ("riderId" = ${userId} OR "passengerId" = ${userId})
    `;

    const row =
      posted[0] && completed[0] ? { ...posted[0], ...completed[0] } : undefined;

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
