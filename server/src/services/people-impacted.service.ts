import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { RIDE_STATUS } from '../constants/enums';

export interface ImpactedPerson {
  id: number;
  name: string;
  img: string;
  rideCount: number;
}

/** Row shape of the partner aggregate. */
interface PartnerRow {
  partnerId: number;
  rideCount: bigint;
}

@Injectable()
export class PeopleImpactedService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lists the people a user has completed rides with, most frequent first.
   *
   * Counting happens in SQL. The previous implementation loaded every
   * completed ride the user had taken, deduplicated matched pairs into a Map,
   * tallied partners in a second Map and sorted in memory -- roughly 90 lines
   * that grew with the user's whole history.
   *
   * A matched trip is stored as two rows sharing a `matchGroupId`, so the
   * inner query collapses each group to one row before counting; otherwise
   * every shared ride would count twice. Rides without a group fall back to
   * their own id, since a plain DISTINCT ON would treat all NULLs as one group.
   */
  async getForUser(userId: number): Promise<{
    people: ImpactedPerson[];
    totalImpacted: number;
  }> {
    const partners = await this.prisma.$queryRaw<PartnerRow[]>`
      WITH trips AS (
        SELECT DISTINCT ON (COALESCE("matchGroupId", 'ride_' || "id"))
               "riderId", "passengerId"
        FROM "Ride"
        WHERE "status"::text = ${RIDE_STATUS.COMPLETED}
          AND ("riderId" = ${userId} OR "passengerId" = ${userId})
        ORDER BY COALESCE("matchGroupId", 'ride_' || "id")
      )
      SELECT partner AS "partnerId", COUNT(*) AS "rideCount"
      FROM (
        SELECT CASE
                 WHEN "riderId" = ${userId} THEN "passengerId"
                 ELSE "riderId"
               END AS partner
        FROM trips
      ) paired
      WHERE partner IS NOT NULL
      GROUP BY partner
      ORDER BY COUNT(*) DESC, partner
    `;

    if (partners.length === 0) {
      return { people: [], totalImpacted: 0 };
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: partners.map((p) => p.partnerId) } },
      select: { id: true, fullname: true, profilePicture: true },
    });

    const byId = new Map(users.map((user) => [user.id, user]));

    // Preserve the ranking the aggregate established.
    const people = partners.flatMap<ImpactedPerson>((partner) => {
      const user = byId.get(partner.partnerId);

      return user
        ? [
            {
              id: user.id,
              name: user.fullname,
              img: user.profilePicture ?? '',
              rideCount: Number(partner.rideCount),
            },
          ]
        : [];
    });

    return { people, totalImpacted: people.length };
  }
}
