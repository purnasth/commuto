import {
  Get,
  Put,
  Post,
  Body,
  Query,
  Param,
  Delete,
  Inject,
  Controller,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { getNow } from './utils/date.util';
import { USER_ROLE, RIDE_STATUS } from './constants/enums';
import { RideGateway } from './rides/rides.gateway';

interface RideDto {
  from: string;
  fromLat?: number;
  fromLng?: number;
  to: string;
  toLat?: number;
  toLng?: number;
  message?: string;
  role: USER_ROLE;
  riderId: number; // user id of the poster
  timestamp?: string;
  status?: RIDE_STATUS;
}

@Controller('rides')
export class RideController {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly rideGateway: RideGateway,
  ) {}

  /**
   * Calculates the great-circle distance between two points on Earth using the Haversine formula.
   * @param lat1 Latitude of the first point
   * @param lon1 Longitude of the first point
   * @param lat2 Latitude of the second point
   * @param lon2 Longitude of the second point
   * @returns Distance in kilometers between the two points
   *
   * Algorithm:
   *   R = 6371 // Earth radius in km
   *   dLat = toRadians(lat2 - lat1)
   *   dLon = toRadians(lon2 - lon1)
   *   a = sin²(dLat/2) + cos(toRadians(lat1)) * cos(toRadians(lat2)) * sin²(dLon/2)
   *   c = 2 * atan2(sqrt(a), sqrt(1-a))
   *   return R * c
   */
  // private haversineDistance(
  //   lat1: number,
  //   lon1: number,
  //   lat2: number,
  //   lon2: number,
  // ): number {
  //   const toRad = (value: number) => (value * Math.PI) / 180;
  //   const R = 6371; // Radius of Earth in kilometers
  //   const dLat = toRad(lat2 - lat1);
  //   const dLon = toRad(lon2 - lon1);
  //   const a =
  //     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  //     Math.cos(toRad(lat1)) *
  //       Math.cos(toRad(lat2)) *
  //       Math.sin(dLon / 2) *
  //       Math.sin(dLon / 2);
  //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  //   return R * c;
  // }
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const R = 6371; // Earth's radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    return parseFloat(distance.toFixed(2)); // round to 2 decimal places
  }

  /**
   * Combined Ride Matching Algorithm
   *
   * Combines geolocation (Haversine), time window, and role matching to return only relevant rides.
   *
   * - Only matches rides with the opposite role.
   * - Only includes rides within +/- 30 minutes of the requested time.
   * - Only includes rides within 2km of the requested location (using Haversine distance).
   *
   * @param fromLat Latitude of the user's requested location
   * @param fromLng Longitude of the user's requested location
   * @param timestamp Requested ride time (ISO string)
   * @param role User's role ("rider" or "passenger")
   * @returns Array of matched rides
   */
  @Get('match')
  async matchRides(
    @Query('fromLat') fromLat: string,
    @Query('fromLng') fromLng: string,
    @Query('timestamp') timestamp: string,
    @Query('role') role: USER_ROLE,
  ) {
    if (!fromLat || !fromLng || !timestamp || !role) {
      throw new BadRequestException(
        'fromLat, fromLng, timestamp, and role are required',
      );
    }
    const fromLatNum = Number(fromLat);
    const fromLngNum = Number(fromLng);
    const timeWindowMinutes = 30; // +/- 30 minutes
    const requestedTime = new Date(timestamp);
    const minTime = new Date(
      requestedTime.getTime() - timeWindowMinutes * 60000,
    );
    const maxTime = new Date(
      requestedTime.getTime() + timeWindowMinutes * 60000,
    );

    // Always match rides with the OPPOSITE role
    const normalizedRole = role;
    const oppositeRole =
      normalizedRole === USER_ROLE.RIDER
        ? USER_ROLE.PASSENGER
        : USER_ROLE.RIDER;
    const rides = await this.prisma.ride.findMany({
      where: {
        role: oppositeRole,
        status: RIDE_STATUS.ACTIVE,
        timestamp: { gte: minTime, lte: maxTime },
        fromLat: { not: null },
        fromLng: { not: null },
      },
      include: { rider: true, passengers: true },
    });

    // Filter by proximity (within 2km)
    const matchedRides = rides.filter((ride) => {
      if (!Number.isFinite(ride.fromLat) || !Number.isFinite(ride.fromLng)) {
        return false;
      }
      const dist = this.haversineDistance(
        fromLatNum,
        fromLngNum,
        ride.fromLat as number,
        ride.fromLng as number,
      );
      return dist <= 2;
    });

    return { rides: matchedRides };
  }

  @Post()
  async createRide(@Body() body: RideDto) {
    this.logger.log({
      level: 'info',
      message: `Create ride attempt by userId=${body.riderId}, from='${body.from}' to='${body.to}', role='${body.role}'`,
      tag: 'ride',
      userId: body.riderId,
      from: body.from,
      to: body.to,
      role: body.role,
    });
    if (!body.from || !body.to || !body.role || !body.riderId) {
      throw new BadRequestException('Missing required fields');
    }
    // Fetch user and check role
    const user = await this.prisma.user.findUnique({
      where: { id: body.riderId },
    });
    if (!user) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: User not found (userId=${body.riderId})`,
        tag: 'ride',
        userId: body.riderId,
      });
      throw new NotFoundException('User not found');
    }
    // Case-insensitive role check
    if (user.role.toLowerCase() !== body.role.toLowerCase()) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: Role mismatch for userId=${body.riderId} (userRole='${user.role}', requestedRole='${body.role}')`,
        tag: 'ride',
        userId: body.riderId,
        userRole: user.role,
        requestedRole: body.role,
      });
      throw new BadRequestException(
        `Role mismatch: You're a '${user.role}', not a '${body.role}'.`,
      );
    }
    // Prevent posting if user has an active ride in last 5 minutes
    const fiveMinAgo = new Date(getNow().getTime() - 5 * 60 * 1000);
    const existingActiveRide = await this.prisma.ride.findFirst({
      where: {
        riderId: body.riderId,
        status: RIDE_STATUS.ACTIVE,
        timestamp: { gte: fiveMinAgo },
      },
    });
    if (existingActiveRide) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: UserId=${body.riderId} already has an active ride`,
        tag: 'ride',
        userId: body.riderId,
      });
      throw new BadRequestException(
        'You already have an active ride and cannot post another at this time.',
      );
    }
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
        riderId: body.riderId,
        timestamp: body.timestamp ? new Date(body.timestamp) : undefined,
        status: RIDE_STATUS.ACTIVE,
      },
    });
    this.logger.log({
      level: 'info',
      message: `Ride created by userId=${body.riderId}: ${JSON.stringify(ride)}`,
      tag: 'ride',
      userId: body.riderId,
      rideId: ride.id,
    });
    return { message: 'Ride created', ride };
  }

  @Get()
  async getRides(@Query('role') role?: string) {
    const now = getNow();
    // Expire rides whose timestamp is in the past and still ACTIVE
    await this.prisma.ride.updateMany({
      where: {
        status: RIDE_STATUS.ACTIVE,
        timestamp: { lt: now },
      },
      data: { status: RIDE_STATUS.EXPIRED },
    });
    // Only show active and confirmed rides with timestamp in the future
    const rides = await this.prisma.ride.findMany({
      where: {
        ...(role ? { role } : {}),
        status: { in: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED] },
        timestamp: { gte: now },
      },
      include: { rider: true },
      orderBy: { timestamp: 'desc' },
    });
    return { rides };
  }

  // Get all ride history for a user (as rider or passenger)
  @Get('history')
  async getRideHistory(@Query('userId') userId: string) {
    const now = getNow();
    // Expire rides whose timestamp is in the past and still ACTIVE
    await this.prisma.ride.updateMany({
      where: {
        status: RIDE_STATUS.ACTIVE,
        timestamp: { lt: now },
      },
      data: { status: RIDE_STATUS.EXPIRED },
    });
    const id = Number(userId);
    if (!userId || isNaN(id)) {
      throw new BadRequestException('Valid userId is required');
    }
    const rides = await this.prisma.ride.findMany({
      where: {
        OR: [{ riderId: id }, { passengers: { some: { id: id } } }],
      },
      include: {
        rider: true,
        passengers: true,
        requests: true,
        ratings: true,
        messages: true,
      },
      orderBy: { timestamp: 'desc' },
    });
    return { rides };
  }

  @Get(':id')
  async getRide(@Param('id') id: string) {
    const rideId = Number(id);
    if (!id || isNaN(rideId)) {
      throw new BadRequestException('Valid ride id is required');
    }
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        rider: true,
        passengers: true,
        requests: true,
        ratings: true,
        messages: true,
      },
    });
    if (!ride) throw new NotFoundException('Ride not found');
    return { ride };
  }

  @Put(':id')
  async updateRide(@Param('id') id: string, @Body() updates: Partial<RideDto>) {
    const ride = await this.prisma.ride.update({
      where: { id: Number(id) },
      data: updates,
    });
    return { message: 'Ride updated', ride };
  }

  @Delete(':id')
  async deleteRide(@Param('id') id: string) {
    this.logger.log({
      level: 'warn',
      message: `Deleting ride with id: ${id}`,
      tag: 'ride',
      rideId: id,
    });
    await this.prisma.ride.delete({ where: { id: Number(id) } });
    return { message: 'Ride deleted' };
  }

  // Confirm a ride (mark as completed)
  @Post(':id/confirm')
  async confirmRide(@Param('id') id: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: Number(id) },
      include: {
        passengers: true, // Include passengers to get their IDs
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const matchedRides = await this.prisma.ride.findMany({
      where: {
        from: ride.from,
        to: ride.to,
        timestamp: {
          gte: new Date(new Date(ride.timestamp).getTime() - 2 * 60 * 1000),
          lte: new Date(new Date(ride.timestamp).getTime() + 2 * 60 * 1000),
        },
        status: RIDE_STATUS.ACTIVE,
      },
      include: {
        passengers: true,
      },
    });

    const matchedIds = matchedRides.map((r) => r.id);

    await this.prisma.ride.updateMany({
      where: { id: { in: matchedIds } },
      data: { status: RIDE_STATUS.CONFIRMED },
    });

    const updatedRides = await this.prisma.ride.findMany({
      where: { id: { in: matchedIds } },
      include: {
        rider: true,
        passengers: true,
      },
    });

    for (const confirmedRide of updatedRides) {
      this.rideGateway.notifyRideConfirmation(confirmedRide);

      // Notify all passengers associated with this specific confirmed ride
      for (const passenger of confirmedRide.passengers) {
        this.rideGateway.notifyRideConfirmationForPassenger(
          confirmedRide,
          passenger.id,
        );
      }
    }

    console.log({
      message: 'All matched rides confirmed',
      rides: updatedRides,
    });

    return {
      message: 'All matched rides confirmed',
      rides: updatedRides,
    };
  }

  // @Post(':id/confirm')
  // async confirmRide(@Param('id') id: string) {
  //   const rideId = Number(id);
  //   const baseRide = await this.prisma.ride.findUnique({
  //     where: { id: rideId },
  //     include: { passengers: true, rider: true },
  //   });
  //   if (!baseRide) {
  //     throw new NotFoundException('Ride not found');
  //   }
  //   const timeWindowMs = 2 * 60 * 1000;
  //   const baseTime = new Date(baseRide.timestamp);
  //   const matchedRides = await this.prisma.ride.findMany({
  //     where: {
  //       from: baseRide.from,
  //       to: baseRide.to,
  //       timestamp: {
  //         gte: new Date(baseTime.getTime() - timeWindowMs),
  //         lte: new Date(baseTime.getTime() + timeWindowMs),
  //       },
  //       status: RIDE_STATUS.ACTIVE,
  //     },
  //     include: {
  //       rider: true,
  //       passengers: true,
  //     },
  //   });
  //   if (!matchedRides.length) {
  //     return { message: 'No active rides matched to confirm.', rides: [] };
  //   }
  //   // Calculate and update distance, co2Saved, peopleImpacted, and award karma points
  //   for (const ride of matchedRides) {
  //     let distance: null | number = null;
  //     if (
  //       typeof ride.fromLat === 'number' &&
  //       typeof ride.fromLng === 'number' &&
  //       typeof ride.toLat === 'number' &&
  //       typeof ride.toLng === 'number'
  //     ) {
  //       distance = this.haversineDistance(
  //         ride.fromLat,
  //         ride.fromLng,
  //         ride.toLat,
  //         ride.toLng,
  //       );
  //     }
  //     const co2Saved = distance ? distance * 0.17 : null; // 0.17kg per km
  //     const peopleImpacted = ride.passengers ? ride.passengers.length : 0;
  //     // Update ride
  //     await this.prisma.ride.update({
  //       where: { id: ride.id },
  //       data: {
  //         status: RIDE_STATUS.CONFIRMED,
  //         distance,
  //         co2Saved,
  //         peopleImpacted,
  //       },
  //     });
  //     // Award karma points to the rider
  //     const karmaPoints = 20;
  //     await this.prisma.user.update({
  //       where: { id: ride.rider.id },
  //       data: {
  //         karmaPoints: { increment: karmaPoints },
  //       },
  //     });
  //     // Create a KarmaTransaction record
  //     await this.prisma.karmaTransaction.create({
  //       data: {
  //         userId: ride.rider.id,
  //         points: karmaPoints,
  //         type: 'earned',
  //         reason: 'Ride completed',
  //       },
  //     });
  //   }
  //   // Notify clients
  //   for (const ride of matchedRides) {
  //     this.rideGateway.notifyRideConfirmationForPassenger(ride, ride.rider.id);
  //     this.rideGateway.notifyRideConfirmation(ride);
  //   }
  //   // Return updated rides
  //   const updatedRides = await this.prisma.ride.findMany({
  //     where: { id: { in: matchedRides.map((r) => r.id) } },
  //     include: { rider: true, passengers: true },
  //   });
  //   return {
  //     message: 'All matched rides confirmed',
  //     rides: updatedRides,
  //   };
  // }

  @Post(':id/complete')
  async completeRide(@Param('id') id: string) {
    const rideId = Number(id);

    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { passengers: true, rider: true },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== RIDE_STATUS.CONFIRMED) {
      throw new BadRequestException(
        'Ride is not confirmed or already completed',
      );
    }

    let distance: number | null = null;
    if (
      typeof ride.fromLat === 'number' &&
      typeof ride.fromLng === 'number' &&
      typeof ride.toLat === 'number' &&
      typeof ride.toLng === 'number'
    ) {
      distance = this.haversineDistance(
        ride.fromLat,
        ride.fromLng,
        ride.toLat,
        ride.toLng,
      );
    }

    const co2Saved = distance ? distance * 0.17 : null;

    const peopleImpacted = ride.passengers.length;

    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: RIDE_STATUS.COMPLETED,
        distance,
        co2Saved,
        peopleImpacted,
      },
      include: {
        passengers: true,
        rider: true,
      },
    });

    // Award karma points to the rider
    const karmaPoints = 20;
    await this.prisma.user.update({
      where: { id: ride.rider.id },
      data: {
        karmaPoints: { increment: karmaPoints },
      },
    });

    await this.prisma.karmaTransaction.create({
      data: {
        userId: ride.rider.id,
        points: karmaPoints,
        type: 'earned',
        reason: 'Ride completed',
      },
    });

    this.rideGateway.notifyRideCompletion(updatedRide);

    return {
      message: 'Ride completed and users notified.',
      ride: updatedRide,
    };
  }

  // Reject a ride (mark as rejected)
  @Post(':id/reject')
  async rejectRide(@Param('id') id: string, @Body() body: { userId: number }) {
    // Mark ride as rejected
    const ride = await this.prisma.ride.update({
      where: { id: Number(id) },
      data: { status: RIDE_STATUS.REJECTED },
    });
    return {
      message: 'Ride rejected. You can now post a new ride.',
      rideId: id,
      userId: body.userId,
      ride,
    };
  }

  // Cancel a ride (mark as cancelled)
  @Post(':id/cancel')
  async cancelRide(@Param('id') id: string, @Body() body: { userId: number }) {
    // Mark ride as cancelled
    const ride = await this.prisma.ride.update({
      where: { id: Number(id) },
      data: { status: RIDE_STATUS.CANCELLED },
    });
    return {
      message: 'Ride cancelled. You can now post a new ride.',
      rideId: id,
      userId: body.userId,
      ride,
    };
  }
}
