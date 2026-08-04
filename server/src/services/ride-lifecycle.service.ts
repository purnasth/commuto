import { randomUUID } from 'crypto';

import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { PrismaService } from '../prisma.service';
import { USER_ROLE, RIDE_STATUS } from '../constants/enums';
import { assertTransition } from '../rides/ride-lifecycle';
import { ConfirmRideDto } from '../interfaces/types';
import { RideGateway } from '../rides/rides.gateway';
import {
  RIDE_WITH_GROUP_SELECT,
  RIDE_WITH_PARTICIPANTS_SELECT,
  RideWithParticipants,
} from '../dto/ride-response.dto';
import {
  haversineDistance,
  estimateCO2FromDistance,
} from '../utils/rideStats.util';

/** Terminal states a user can move a ride into directly. */
export type RetireStatus = RIDE_STATUS.CANCELLED | RIDE_STATUS.REJECTED;

@Injectable()
export class RideLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly rideGateway: RideGateway,
  ) {}

  /**
   * Pairs the caller's ride with the one they picked, marking both CONFIRMED.
   *
   * The two rows are claimed in a single conditional statement inside a
   * transaction: the ACTIVE requirement lives in the WHERE clause, so whichever
   * request commits first wins and the loser matches fewer than two rows.
   * Without it, two passengers confirming the same rider at once would both
   * succeed and silently overwrite each other.
   */
  async confirm(
    rideId: number,
    body: ConfirmRideDto,
    userId: number,
  ): Promise<RideWithParticipants[]> {
    const currentRide = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: RIDE_WITH_PARTICIPANTS_SELECT,
    });

    if (!currentRide) {
      throw new NotFoundException('Ride not found');
    }

    assertTransition(currentRide, RIDE_STATUS.CONFIRMED, userId);

    const pairing = this.resolvePairing(currentRide, body);

    const targetRide = await this.prisma.ride.findUnique({
      where: { id: pairing.targetRideId },
      select: { id: true },
    });

    if (!targetRide) {
      throw new NotFoundException('Target ride not found');
    }

    const matchGroupId = randomUUID();
    const rideIds = [rideId, pairing.targetRideId];

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.ride.updateMany({
        where: { id: { in: rideIds }, status: RIDE_STATUS.ACTIVE },
        data: {
          status: RIDE_STATUS.CONFIRMED,
          riderId: pairing.riderId,
          passengerId: pairing.passengerId,
          matchGroupId,
        },
      });

      if (claimed.count < rideIds.length) {
        this.logger.log({
          level: 'warn',
          message: `Confirm ride failed: a ride was no longer active`,
          tag: 'ride',
          rideIds,
          claimedCount: claimed.count,
        });
        throw new BadRequestException(
          'This ride is no longer available. It may have just been matched by someone else.',
        );
      }

      // Link the passenger to both rides in the many-to-many relation.
      for (const id of rideIds) {
        await tx.ride.update({
          where: { id },
          data: { passengers: { connect: { id: pairing.passengerId } } },
        });
      }

      // Record the journey itself, in the same transaction as the claim so a
      // confirmed pair can never exist without its Trip.
      await tx.trip.create({
        data: {
          matchGroupId,
          riderId: pairing.riderId,
          passengerId: pairing.passengerId,
          status: RIDE_STATUS.CONFIRMED,
          from: currentRide.from,
          to: currentRide.to,
          timestamp: currentRide.timestamp,
        },
      });
    });

    this.logger.log({
      level: 'info',
      message: `Confirmed matched rides`,
      tag: 'ride',
      rideIds,
      riderId: pairing.riderId,
      passengerId: pairing.passengerId,
    });

    const updatedRides = await this.prisma.ride.findMany({
      where: { id: { in: rideIds } },
      select: RIDE_WITH_PARTICIPANTS_SELECT,
    });

    for (const confirmedRide of updatedRides) {
      await this.rideGateway.notifyRideConfirmation(confirmedRide);
    }

    return updatedRides;
  }

  /**
   * Works out which ride is being paired with, and who ends up in each seat.
   *
   * A rider confirming picks a passenger's posting and vice versa, so the
   * required body fields differ by the caller's side of the trip.
   */
  private resolvePairing(
    currentRide: RideWithParticipants,
    body: ConfirmRideDto,
  ): { targetRideId: number; riderId: number; passengerId: number } {
    if (currentRide.role === USER_ROLE.RIDER) {
      if (!body.passengerId || !body.passengerRideId) {
        throw new BadRequestException(
          'passengerId and passengerRideId are required for confirming a passenger ride',
        );
      }
      if (currentRide.riderId === null) {
        throw new BadRequestException(
          'Current ride does not have a valid riderId',
        );
      }

      return {
        targetRideId: body.passengerRideId,
        riderId: currentRide.riderId,
        passengerId: body.passengerId,
      };
    }

    if (!body.riderId || !body.riderRideId) {
      throw new BadRequestException(
        'riderId and riderRideId are required for confirming a rider ride',
      );
    }
    if (currentRide.passengerId === null) {
      throw new BadRequestException(
        'Current ride does not have a valid passengerId',
      );
    }

    return {
      targetRideId: body.riderRideId,
      riderId: body.riderId,
      passengerId: currentRide.passengerId,
    };
  }

  /**
   * Marks a confirmed trip finished and records its distance and CO2 saving.
   *
   * Both halves of a matched trip move together; the statistics are derived
   * server-side from the stored coordinates rather than accepted from the
   * client.
   */
  async complete(
    rideId: number,
    userId: number,
  ): Promise<{ rides: RideWithParticipants[]; isRider: boolean }> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: RIDE_WITH_GROUP_SELECT,
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    assertTransition(ride, RIDE_STATUS.COMPLETED, userId);

    const distance =
      typeof ride.fromLat === 'number' &&
      typeof ride.fromLng === 'number' &&
      typeof ride.toLat === 'number' &&
      typeof ride.toLng === 'number'
        ? haversineDistance(ride.fromLat, ride.fromLng, ride.toLat, ride.toLng)
        : null;

    const completion = {
      status: RIDE_STATUS.COMPLETED,
      distance,
      co2Saved: distance === null ? null : estimateCO2FromDistance(distance),
      peopleImpacted: ride.passengers?.length ?? 0,
    };

    // Guard on the current status so a concurrent transition is not clobbered.
    const scope = ride.matchGroupId
      ? { matchGroupId: ride.matchGroupId }
      : { id: rideId };

    await this.prisma.$transaction(async (tx) => {
      await tx.ride.updateMany({
        where: { ...scope, status: RIDE_STATUS.CONFIRMED },
        data: completion,
      });

      if (ride.matchGroupId) {
        await tx.trip.updateMany({
          where: {
            matchGroupId: ride.matchGroupId,
            status: RIDE_STATUS.CONFIRMED,
          },
          data: completion,
        });
      }
    });

    const rides = await this.prisma.ride.findMany({
      where: scope,
      select: RIDE_WITH_GROUP_SELECT,
    });

    this.logger.log({
      level: 'info',
      message: `Ride(s) completed`,
      tag: 'ride',
      rideId,
      completedByUserId: userId,
      matchGroupId: ride.matchGroupId,
      updatedRideCount: rides.length,
      ...completion,
    });

    if (rides.length > 0) {
      await this.rideGateway.notifyRideCompletion(rides[0]);
    }

    return { rides, isRider: ride.riderId === userId };
  }

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

    await this.prisma.$transaction(async (tx) => {
      await tx.ride.updateMany({
        where: { ...scope, status: ride.status },
        data: { status: target },
      });

      if (ride.matchGroupId) {
        await tx.trip.updateMany({
          where: { matchGroupId: ride.matchGroupId, status: ride.status },
          data: { status: target },
        });
      }
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
