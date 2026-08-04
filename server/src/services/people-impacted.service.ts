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
   * Lists the people a user has completed trips with, most frequent first.
   *
   * Reads from `Trip`, which already holds one row per journey. The previous
   * version had to collapse pairs of Ride rows sharing a `matchGroupId` before
   * it could count anything -- first with two Maps in application code, then
   * with a DISTINCT ON subquery. Neither is needed now: counting a table whose
   * rows already mean "one trip" is a plain GROUP BY.
   */
  async getForUser(userId: number): Promise<{
    people: ImpactedPerson[];
    totalImpacted: number;
  }> {
    const partners = await this.prisma.$queryRaw<PartnerRow[]>`
      SELECT partner AS "partnerId", COUNT(*) AS "rideCount"
      FROM (
        SELECT CASE
                 WHEN "riderId" = ${userId} THEN "passengerId"
                 ELSE "riderId"
               END AS partner
        FROM "Trip"
        WHERE "status"::text = ${RIDE_STATUS.COMPLETED}
          AND ("riderId" = ${userId} OR "passengerId" = ${userId})
      ) paired
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
