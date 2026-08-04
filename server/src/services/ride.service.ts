import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { PrismaService } from '../prisma.service';
import { USER_ROLE, RIDE_STATUS } from '../constants/enums';
import { CreateRideDto } from '../dto/create-ride.dto';
import {
  RIDE_WITH_PARTICIPANTS_SELECT,
  RideWithParticipants,
} from '../dto/ride-response.dto';
import { RideExpiryService } from './ride-expiry.service';

@Injectable()
export class RideService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  /**
   * Posts a new ride on behalf of a user.
   *
   * Two rules apply beyond the field validation the DTO already performs: the
   * ride must match the role the account holds, and a user may only have one
   * live ride at a time.
   */
  async create(
    userId: number,
    body: CreateRideDto,
  ): Promise<RideWithParticipants> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Both sides are enums, so this is a plain comparison; it used to need
    // case normalisation because the two columns disagreed on capitalisation.
    if (user.role !== body.role) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: role mismatch`,
        tag: 'ride',
        userId,
        userRole: user.role,
        requestedRole: body.role,
      });
      throw new BadRequestException(
        `Role mismatch: You're a '${user.role}', not a '${body.role}'.`,
      );
    }

    await this.assertNoLiveRide(userId);

    // The poster occupies the seat matching their own role; the other side is
    // filled in when a match is confirmed.
    const isRider = body.role === USER_ROLE.RIDER;

    const ride = await this.prisma.ride.create({
      data: {
        from: body.from,
        fromLat: body.fromLat,
        fromLng: body.fromLng,
        to: body.to,
        toLat: body.toLat,
        toLng: body.toLng,
        message: body.message,
        role: body.role,
        createdBy: userId,
        riderId: isRider ? userId : null,
        passengerId: isRider ? null : userId,
        estimatedTimeOfArrival: body.estimatedTimeOfArrival,
        timestamp: body.timestamp ? new Date(body.timestamp) : undefined,
        status: RIDE_STATUS.ACTIVE,
      },
      select: RIDE_WITH_PARTICIPANTS_SELECT,
    });

    this.logger.log({
      level: 'info',
      message: `Ride created`,
      tag: 'ride',
      userId,
      rideId: ride.id,
      role: body.role,
    });

    return ride;
  }

  /**
   * Rejects the request if the user already has a ride in play.
   *
   * The timestamp bound matters because expiry is swept on a schedule rather
   * than on read: without it, a ride already past its grace period would keep
   * blocking new posts until the next sweep happened to run.
   */
  private async assertNoLiveRide(userId: number): Promise<void> {
    const existing = await this.prisma.ride.findFirst({
      where: {
        createdBy: userId,
        status: { in: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED] },
        timestamp: { gte: RideExpiryService.expiryCutoff() },
      },
      select: { id: true, status: true },
    });

    if (existing) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: user already has a live ride`,
        tag: 'ride',
        userId,
        existingRideId: existing.id,
        existingRideStatus: existing.status,
      });
      throw new BadRequestException(
        'You already have an active or confirmed ride and cannot post another at this time.',
      );
    }
  }
}
