import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { PrismaService } from '../prisma.service';
import {
  RIDE_STATUS,
  RIDE_EXPIRATION_GRACE_MINUTES,
} from '../constants/enums';
import { getNow } from '../utils/date.util';

/**
 * Retires rides whose scheduled time has passed.
 *
 * This used to run inline on three read endpoints, which meant every listing,
 * history fetch and current-ride poll performed a table scan and a write. Read
 * traffic generated write load and lock contention on the busiest rows.
 *
 * The sweep is now scheduled, so reads are pure reads. Because a row can sit
 * expired-but-unswept for up to one interval, queries that care must also
 * filter on `timestamp` rather than trusting `status` alone -- see
 * `expiryCutoff()`, which is the single definition of that boundary.
 */
@Injectable()
export class RideExpiryService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  /**
   * Rides scheduled before this instant are expired, whether or not the sweep
   * has caught up with them yet.
   */
  static expiryCutoff(): Date {
    return new Date(
      getNow().getTime() - RIDE_EXPIRATION_GRACE_MINUTES * 60 * 1000,
    );
  }

  /** Statuses that a sweep can move to EXPIRED. */
  private static readonly EXPIRABLE = [
    RIDE_STATUS.ACTIVE,
    RIDE_STATUS.CONFIRMED,
  ];

  @Cron(CronExpression.EVERY_30_SECONDS)
  async sweep(): Promise<number> {
    const cutoffTime = RideExpiryService.expiryCutoff();

    // A single conditional UPDATE: the previous implementation read the rows
    // first purely to log them, doubling the work on every call.
    const { count } = await this.prisma.ride.updateMany({
      where: {
        status: { in: RideExpiryService.EXPIRABLE },
        timestamp: { lt: cutoffTime },
      },
      data: { status: RIDE_STATUS.EXPIRED },
    });

    if (count > 0) {
      this.logger.log({
        level: 'info',
        message: `Expired ${count} rides past their grace period`,
        tag: 'ride',
        cutoffTime: cutoffTime.toISOString(),
        graceMinutes: RIDE_EXPIRATION_GRACE_MINUTES,
        expiredCount: count,
      });
    }

    return count;
  }
}
