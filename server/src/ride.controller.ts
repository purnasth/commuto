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
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
    // Mark this ride and all matched rides (same timestamp, from, to, and status ACTIVE) as confirmed
    const ride = await this.prisma.ride.findUnique({
      where: { id: Number(id) },
    });
    if (!ride) throw new NotFoundException('Ride not found');
    // Find all rides that match this ride (same from, to, timestamp, and status ACTIVE)
    const matchedRides = await this.prisma.ride.findMany({
      where: {
        from: ride.from,
        to: ride.to,
        timestamp: ride.timestamp,
        status: RIDE_STATUS.ACTIVE,
      },
    });
    const matchedIds = matchedRides.map((r) => r.id);
    await this.prisma.ride.updateMany({
      where: { id: { in: matchedIds } },
      data: { status: RIDE_STATUS.CONFIRMED },
    });
    // Return updated rides
    const updatedRides = await this.prisma.ride.findMany({
      where: { id: { in: matchedIds } },
    });
    return {
      message: 'All matched rides confirmed',
      rides: updatedRides,
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
