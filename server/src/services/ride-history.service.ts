import { Injectable } from '@nestjs/common';

import { Prisma } from 'generated/prisma';

import { PrismaService } from '../prisma.service';
import { RideCursor } from '../dto/pagination.dto';

interface RideKeyRow {
  id: number;
  timestamp: Date;
}

@Injectable()
export class RideHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the ids of a user's rides, newest first, one row per trip.
   *
   * A matched trip is two rows sharing a `matchGroupId`, so the inner query
   * collapses each group to a single row. This deduplication used to happen in
   * JavaScript after loading every ride the user had ever taken, which is what
   * made the endpoint impossible to paginate: a page of 25 rows could collapse
   * to 13, so page size became unpredictable and the cursor could skip trips.
   *
   * Rides with no group fall back to their own id as the grouping key. A plain
   * `DISTINCT ON ("matchGroupId")` would treat every NULL as one group and
   * collapse all unmatched rides into a single row.
   *
   * Fetches `limit + 1` so the caller can tell whether a further page exists
   * without a second COUNT.
   */
  async getTripKeys(
    userId: number,
    cursor: RideCursor | null,
    limit: number,
  ): Promise<RideKeyRow[]> {
    // Seek predicate for a (timestamp DESC, id DESC) ordering.
    //
    // The cursor instant is passed as an ISO string cast to `timestamp`, not
    // as a JS Date. `Ride.timestamp` is `timestamp without time zone`, and a
    // bound Date arrives as `timestamptz`, so Postgres converts the column
    // through the session time zone before comparing. Under a non-UTC session
    // that shifts every comparison by the local offset and the seek silently
    // returns rows it has already served.
    const cursorTimestamp = cursor?.timestamp.toISOString();
    const after = cursor
      ? Prisma.sql`WHERE d."timestamp" < ${cursorTimestamp}::timestamp
                      OR (d."timestamp" = ${cursorTimestamp}::timestamp
                          AND d."id" < ${cursor.id})`
      : Prisma.empty;

    return this.prisma.$queryRaw<RideKeyRow[]>`
      SELECT d."id", d."timestamp"
      FROM (
        SELECT DISTINCT ON (COALESCE("matchGroupId", 'ride_' || "id"))
               "id", "timestamp"
        FROM "Ride"
        WHERE "riderId" = ${userId}
           OR "passengerId" = ${userId}
           OR "createdBy" = ${userId}
        ORDER BY COALESCE("matchGroupId", 'ride_' || "id"),
                 "timestamp" DESC, "id" DESC
      ) d
      ${after}
      ORDER BY d."timestamp" DESC, d."id" DESC
      LIMIT ${limit + 1}
    `;
  }
}
