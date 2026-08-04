import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { PrismaService } from '../prisma.service';
import { RIDE_STATUS } from '../constants/enums';
import { assertTransition } from '../rides/ride-lifecycle';
import {
  RIDE_WITH_GROUP_SELECT,
  RideWithParticipants,
} from '../dto/ride-response.dto';

/** Terminal states a user can move a ride into directly. */
export type RetireStatus = RIDE_STATUS.CANCELLED | RIDE_STATUS.REJECTED;

@Injectable()
export class RideLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  /**
   * Moves a ride to a terminal state on behalf of a user.
   *
   * Both call sites previously issued a bare `update` on whatever id appeared
   * in the URL, so any authenticated user could cancel or reject a ride
   * belonging to someone else, in any state. The transition table now decides
   * both questions -- may this person act, and is the ride in a state that
   * permits it -- before anything is written.
   *
   * When the ride is half of a matched trip, both halves move together.
   * Retiring one row alone would leave the counterparty holding a CONFIRMED
   * ride whose partner had silently disappeared.
   */
  async retire(
    rideId: number,
    target: RetireStatus,
    userId: number,
  ): Promise<RideWithParticipants> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: RIDE_WITH_GROUP_SELECT,
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    assertTransition(ride, target, userId);

    // The current status is repeated in the WHERE clause so a concurrent
    // transition cannot be overwritten between the check and the write.
    const scope = ride.matchGroupId
      ? { matchGroupId: ride.matchGroupId }
      : { id: rideId };

    await this.prisma.ride.updateMany({
      where: { ...scope, status: ride.status },
      data: { status: target },
    });

    this.logger.log({
      level: 'info',
      message: `Ride moved to ${target}`,
      tag: 'ride',
      rideId,
      userId,
      previousStatus: ride.status,
      newStatus: target,
      matchGroupId: ride.matchGroupId,
    });

    const updated = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: RIDE_WITH_GROUP_SELECT,
    });

    // The row was found a moment ago and nothing deletes rides here.
    return updated ?? { ...ride, status: target };
  }
}
