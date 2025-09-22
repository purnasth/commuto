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
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from './prisma.service';
import { RideGateway } from './rides/rides.gateway';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import {
  RIDE_MATCH_WINDOW_MINUTES,
  RIDE_EXPIRATION_GRACE_MINUTES,
  FEEDBACK_EMOJI,
  FEEDBACK_POINTS,
} from './constants/enums';
import { USER_ROLE, RIDE_STATUS } from './constants/enums';

import {
  calculateETA,
  haversineDistance,
  MAX_RIDE_PROXIMITY_KM,
  estimateCO2FromDistance,
} from './utils/rideStats.util';
import { getNow } from './utils/date.util';
import { getTimeWindow } from './utils/timeWindow.util';

interface RideDto {
  from: string;
  fromLat?: number;
  fromLng?: number;
  to: string;
  toLat?: number;
  toLng?: number;
  message?: string;
  role: USER_ROLE;
  createdBy: number; // user id of the creator
  estimatedTimeOfArrival?: number;
  timestamp?: string;
  status?: RIDE_STATUS;
}

interface ConfirmRideDto {
  passengerId?: number;
  passengerRideId?: number;
  riderId?: number;
  riderRideId?: number;
}

interface FeedbackDto {
  rideId: number;
  fromUserId: number;
  toUserId: number;
  role: USER_ROLE;
  emoji: FEEDBACK_EMOJI; // 0=😊, 1=😐, 2=😠
  comment?: string;
}

@Controller('rides')
export class RideController {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly rideGateway: RideGateway,
  ) {}

  @Get('/user/:id/karma-points')
  /**
   * Retrieves the karma points for a user by their ID.
   *
   * @param id - The ID of the user as a string.
   * @returns An object containing the user's karma points.
   * @throws {BadRequestException} If the provided ID is missing or invalid.
   * @throws {NotFoundException} If the user with the given ID does not exist.
   *
   * TODO (refactor priority):
   *   - Annotate return type with DTO (GetKarmaPointsResponseDto)
   *   - Add @Throttle() decorator for rate limiting
   *   - Consider access control/auth guard for this endpoint
   */
  async getUserKarmaPoints(@Param('id', ParseIntPipe) userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { karmaPoints: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { karmaPoints: user.karmaPoints };
  }

  @Post('/feedback')
  /**
   * Submit feedback for a completed ride
   * Updates karma points for riders and credit score for passengers
   */
  async submitFeedback(@Body() body: FeedbackDto) {
    this.logger.log({
      level: 'info',
      message: `Feedback submission attempt for ride ${body.rideId} from user ${body.fromUserId} to user ${body.toUserId}`,
      tag: 'feedback',
      rideId: body.rideId,
      fromUserId: body.fromUserId,
      toUserId: body.toUserId,
      role: body.role,
      emoji: body.emoji,
    });

    // Validate required fields
    if (
      !body.rideId ||
      !body.fromUserId ||
      !body.toUserId ||
      !body.role ||
      body.emoji === undefined ||
      body.emoji === null
    ) {
      throw new BadRequestException('Missing required feedback fields');
    }

    // Validate emoji
    const validEmojis = [
      FEEDBACK_EMOJI.SATISFIED,
      FEEDBACK_EMOJI.NEUTRAL,
      FEEDBACK_EMOJI.DISSATISFIED,
    ];
    if (!validEmojis.includes(body.emoji)) {
      throw new BadRequestException(
        `Invalid emoji. Must be one of: ${validEmojis.join(', ')} (0=😊, 1=😐, 2=😠)`,
      );
    }

    // Check if ride exists and is completed
    const ride = await this.prisma.ride.findUnique({
      where: { id: body.rideId },
      include: { rider: true, passengers: true },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    // Only allow feedback for completed rides
    if (ride.status !== RIDE_STATUS.COMPLETED) {
      throw new BadRequestException(
        'Feedback can only be submitted for completed rides',
      );
    }

    // Verify that fromUser is part of this ride
    const isRider = ride.riderId === body.fromUserId;
    const isPassenger = ride.passengerId === body.fromUserId;

    if (!isRider && !isPassenger) {
      throw new BadRequestException('User is not part of this ride');
    }

    // Check for duplicate feedback
    let existingFeedback: any;
    try {
      existingFeedback = await this.prisma.feedback.findFirst({
        where: {
          rideId: body.rideId,
          fromUserId: body.fromUserId,
          toUserId: body.toUserId,
        },
      });
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: 'Error checking for existing feedback',
        tag: 'feedback',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new BadRequestException('Error checking feedback status');
    }

    if (existingFeedback) {
      throw new BadRequestException('Feedback already submitted for this ride');
    }

    // Create feedback record
    let feedback: any;
    try {
      feedback = await this.prisma.feedback.create({
        data: {
          rideId: body.rideId,
          fromUserId: body.fromUserId,
          toUserId: body.toUserId,
          role: body.role,
          emoji: body.emoji,
          comment: body.comment,
        },
      });
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: 'Error creating feedback record',
        tag: 'feedback',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new BadRequestException('Error creating feedback');
    }

    // Calculate points based on emoji using enum system
    const basePoints = FEEDBACK_POINTS.BASE_POINTS;
    const bonusPoints = FEEDBACK_POINTS.BONUS_POINTS[body.emoji];
    const totalPoints = basePoints + bonusPoints;

    // Update user scores based on their role
    if (body.role === USER_ROLE.RIDER) {
      // Update rider's karma points
      await this.prisma.user.update({
        where: { id: body.fromUserId },
        data: { karmaPoints: { increment: totalPoints } },
      });

      // Create karma transaction
      await this.prisma.karmaTransaction.create({
        data: {
          userId: body.fromUserId,
          points: totalPoints,
          type: 'earned',
          reason: `Ride feedback: emoji ${body.emoji} (${basePoints} base + ${bonusPoints} bonus)`,
        },
      });

      this.logger.log({
        level: 'info',
        message: `Karma points awarded to rider ${body.fromUserId}: ${totalPoints} points`,
        tag: 'feedback',
        userId: body.fromUserId,
        points: totalPoints,
      });
    } else if (body.role === USER_ROLE.PASSENGER) {
      // Update passenger's credit score
      await this.prisma.user.update({
        where: { id: body.fromUserId },
        data: { creditScore: { increment: totalPoints } },
      });

      this.logger.log({
        level: 'info',
        message: `Credit score awarded to passenger ${body.fromUserId}: ${totalPoints} points`,
        tag: 'feedback',
        userId: body.fromUserId,
        points: totalPoints,
      });
    }

    // Check if both users have submitted feedback to determine response
    const allFeedback = await this.prisma.feedback.findMany({
      where: { rideId: body.rideId },
    });

    const riderFeedback = allFeedback.find((f) => f.role === USER_ROLE.RIDER);
    const passengerFeedback = allFeedback.find(
      (f) => f.role === USER_ROLE.PASSENGER,
    );

    // Since ride is already completed, check if both users have now submitted feedback
    const bothSubmitted = riderFeedback && passengerFeedback;

    // Get updated user data to return
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: body.fromUserId },
      select: { id: true, karmaPoints: true, creditScore: true },
    });

    return {
      message: 'Feedback submitted successfully',
      feedback,
      pointsAwarded: totalPoints,
      user: updatedUser,
      feedbackComplete: bothSubmitted,
      waitingForOtherUser: !bothSubmitted,
    };
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
      this.logger.log({
        level: 'warn',
        message: `Match rides failed: Missing required query params`,
        tag: 'ride',
        fromLat,
        fromLng,
        timestamp,
        role,
      });
      throw new BadRequestException(
        'fromLat, fromLng, timestamp, and role are required',
      );
    }
    const fromLatNum = Number(fromLat);
    const fromLngNum = Number(fromLng);

    // Use global constant and utility for time window
    const { min: minTime, max: maxTime } = getTimeWindow(
      timestamp,
      RIDE_MATCH_WINDOW_MINUTES,
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
      include: { rider: true, passengers: true, createdByUser: true },
    });

    this.logger.log({
      level: 'info',
      message: `Matching rides for role=${role}, location=(${fromLat},${fromLng}), time=${timestamp}`,
      tag: 'ride',
      role,
      fromLat,
      fromLng,
      timestamp,
      matchedCount: rides.length,
    });

    const matchedRides = rides.filter((ride) => {
      if (!Number.isFinite(ride.fromLat) || !Number.isFinite(ride.fromLng)) {
        return false;
      }
      // Calculate distance between the current user's "From" location and the matched ride's "From" location
      const dist = haversineDistance(
        fromLatNum,
        fromLngNum,
        ride.fromLat as number,
        ride.fromLng as number,
      );

      if (dist <= MAX_RIDE_PROXIMITY_KM) {
        // Calculate ETA based on the mode of transport of the current user
        const estimatedTimeOfArrival = calculateETA(dist);

        ride.estimatedTimeOfArrival = estimatedTimeOfArrival;
        ride.distance = dist;

        return true;
      }

      return false;
    });

    return { rides: matchedRides };
  }

  @Post()
  async createRide(@Body() body: RideDto) {
    this.logger.log({
      level: 'info',
      message: `Create ride attempt by userId=${body.createdBy}, from='${body.from}' to='${body.to}', role='${body.role}'`,
      tag: 'ride',
      userId: body.createdBy,
      from: body.from,
      to: body.to,
      role: body.role,
    });
    if (!body.from || !body.to || !body.role || !body.createdBy) {
      throw new BadRequestException('Missing required fields');
    }
    // Fetch user and check role
    const user = await this.prisma.user.findUnique({
      where: { id: body.createdBy },
    });
    if (!user) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: User not found (userId=${body.createdBy})`,
        tag: 'ride',
        userId: body.createdBy,
      });
      throw new NotFoundException('User not found');
    }
    // Case-insensitive role check
    if (user.role.toLowerCase() !== body.role.toLowerCase()) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: Role mismatch for userId=${body.createdBy} (userRole='${user.role}', requestedRole='${body.role}')`,
        tag: 'ride',
        userId: body.createdBy,
        userRole: user.role,
        requestedRole: body.role,
      });
      throw new BadRequestException(
        `Role mismatch: You're a '${user.role}', not a '${body.role}'.`,
      );
    }
    // Prevent posting if user has an active or confirmed ride (regardless of time)
    const existingActiveRide = await this.prisma.ride.findFirst({
      where: {
        createdBy: body.createdBy,
        status: { in: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED] },
      },
    });
    if (existingActiveRide) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: UserId=${body.createdBy} already has an active or confirmed ride`,
        tag: 'ride',
        userId: body.createdBy,
        existingRideStatus: existingActiveRide.status,
      });
      throw new BadRequestException(
        'You already have an active or confirmed ride and cannot post another at this time.',
      );
    }

    // Determine riderId and passengerId based on role
    let riderId: number | null = null;
    let passengerId: number | null = null;

    if (body.role.toLowerCase() === USER_ROLE.RIDER.toLowerCase()) {
      riderId = body.createdBy;
      passengerId = null;
    } else if (body.role.toLowerCase() === USER_ROLE.PASSENGER.toLowerCase()) {
      riderId = null;
      passengerId = body.createdBy;
    }

    // Create ride with proper role-based assignment
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
        createdBy: body.createdBy,
        riderId: riderId,
        passengerId: passengerId,
        estimatedTimeOfArrival: body.estimatedTimeOfArrival,
        timestamp: body.timestamp ? new Date(body.timestamp) : undefined,
        status: RIDE_STATUS.ACTIVE,
      },
      include: {
        createdByUser: true,
        rider: true,
      },
    });
    this.logger.log({
      level: 'info',
      message: `Ride created by userId=${body.createdBy}: ${JSON.stringify(ride)}`,
      tag: 'ride',
      userId: body.createdBy,
      rideId: ride.id,
    });
    return { message: 'Ride created', ride };
  }

  @Get()
  async getRides(@Query('role') role?: string) {
    const now = getNow();
    // Expire rides whose timestamp is in the past and still ACTIVE
    await this.expireOldRides();

    this.logger.log({
      level: 'info',
      message: `Expired past active rides`,
      tag: 'ride',
      timestamp: now,
    });
    // Only show active and confirmed rides with timestamp in the future
    const rides = await this.prisma.ride.findMany({
      where: {
        ...(role ? { role } : {}),
        status: { in: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED] },
        timestamp: { gte: now },
      },
      include: {
        rider: true,
        createdByUser: true,
        passengers: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    // Add expiry information to each ride
    const ridesWithExpiry = rides.map((ride) => ({
      ...ride,
      expiryTimeSeconds: this.calculateExpiryTimeSeconds(),
      remainingTimeSeconds: this.calculateRemainingTimeSeconds(ride.timestamp),
    }));

    this.logger.log({
      level: 'info',
      message: `Fetched rides`,
      tag: 'ride',
      role,
      rideCount: rides.length,
    });
    return { rides: ridesWithExpiry };
  }

  // Get all ride history for a user (as rider or passenger)
  // TODO: Infinite scroll backend checklist:
  //   1. Add pagination support to /rides/history endpoint (accept page, limit params)
  //   2. Return total count or hasMore flag in response
  //   3. Optimize query for large datasets (indexes, limits)
  //   4. Document API changes for frontend
  @Get('history')
  async getRideHistory(@Query('userId') userId: string) {
    // Expire old rides using the centralized helper
    await this.expireOldRides();

    this.logger.log({
      level: 'info',
      message: `Expired rides older than grace period for history fetch`,
      tag: 'ride',
      timestamp: getNow(),
      userId,
    });
    const id = Number(userId);
    if (!userId || isNaN(id)) {
      this.logger.log({
        level: 'warn',
        message: `Ride history fetch failed: Invalid userId`,
        tag: 'ride',
        userId,
      });
      throw new BadRequestException('Valid userId is required');
    }
    const rides = await this.prisma.ride.findMany({
      where: {
        OR: [{ riderId: id }, { passengerId: id }, { createdBy: id }],
      },
      include: {
        rider: true,
        passengers: true,
        createdByUser: true,
        requests: true,
        ratings: true,
        messages: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    // Group rides by matchGroupId to prevent duplicates
    // TODO (Performance): Optimize by handling deduplication at database level using
    // GROUP BY or DISTINCT ON to reduce memory usage and improve performance for large datasets
    // instead of filtering in memory. This becomes critical with 1000+ rides.
    const uniqueRides: typeof rides = [];
    const seenMatchGroups = new Set();

    for (const ride of rides) {
      if (ride.matchGroupId) {
        // If this ride has a matchGroupId and we haven't seen it yet
        if (!seenMatchGroups.has(ride.matchGroupId)) {
          seenMatchGroups.add(ride.matchGroupId);
          uniqueRides.push(ride);
        }
      } else {
        // If no matchGroupId, include the ride (not a matched ride)
        uniqueRides.push(ride);
      }
    }

    this.logger.log({
      level: 'info',
      message: `Fetched ride history`,
      tag: 'ride',
      userId,
      rideCount: uniqueRides.length,
      originalRideCount: rides.length,
    });
    return { rides: uniqueRides };
  }

  @Get(':id')
  async getRide(@Param('id') id: string, @Query('userId') userId?: string) {
    const rideId = Number(id);
    if (!id || isNaN(rideId)) {
      this.logger.log({
        level: 'warn',
        message: `Get ride failed: Invalid ride id`,
        tag: 'ride',
        rideId: id,
      });
      throw new BadRequestException('Valid ride id is required');
    }
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        rider: true,
        passengers: true,
        createdByUser: true,
        requests: true,
        ratings: true,
        messages: true,
      },
    });
    if (!ride) throw new NotFoundException('Ride not found');

    // Determine the role from the current user's perspective
    let userRole = ride.role; // Default to the original creator's role
    if (userId) {
      const currentUserId = Number(userId);
      if (currentUserId === ride.riderId) {
        userRole = USER_ROLE.RIDER;
      } else if (currentUserId === ride.passengerId) {
        userRole = USER_ROLE.PASSENGER;
      }
    }

    this.logger.log({
      level: 'info',
      message: `Fetched ride details`,
      tag: 'ride',
      rideId,
      requestedByUser: userId,
      userRole,
    });

    return {
      ride: {
        ...ride,
        role: userRole, // Override the role based on current user's perspective
      },
    };
  }

  @Put(':id')
  async updateRide(@Param('id') id: string, @Body() updates: Partial<RideDto>) {
    const ride = await this.prisma.ride.update({
      where: { id: Number(id) },
      data: updates,
    });
    this.logger.log({
      level: 'info',
      message: `Ride updated`,
      tag: 'ride',
      rideId: id,
      updates,
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
    this.logger.log({
      level: 'info',
      message: `Ride deleted`,
      tag: 'ride',
      rideId: id,
    });
    return { message: 'Ride deleted' };
  }

  // Confirm a ride (match rides and mark as confirmed)
  @Post(':id/confirm')
  async confirmRide(@Param('id') id: string, @Body() body: ConfirmRideDto) {
    const rideId = Number(id);
    const currentRide = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        createdByUser: true,
        rider: true,
        passengers: true,
      },
    });

    if (!currentRide) {
      this.logger.log({
        level: 'warn',
        message: `Confirm ride failed: Ride not found`,
        tag: 'ride',
        rideId: id,
      });
      throw new NotFoundException('Ride not found');
    }

    let targetRideId: number;
    let updatedRiderId: number;
    let updatedPassengerId: number;

    // Determine the target ride and user IDs based on the current ride's role
    if (currentRide.role.toLowerCase() === USER_ROLE.RIDER.toLowerCase()) {
      // Current ride is by a rider, confirming a passenger's ride
      if (!body.passengerId || !body.passengerRideId) {
        throw new BadRequestException(
          'passengerId and passengerRideId are required for confirming a passenger ride',
        );
      }
      if (currentRide.riderId === null || currentRide.riderId === undefined) {
        throw new BadRequestException(
          'Current ride does not have a valid riderId',
        );
      }
      targetRideId = body.passengerRideId;
      updatedRiderId = currentRide.riderId;
      updatedPassengerId = body.passengerId;
    } else {
      // Current ride is by a passenger, confirming a rider's ride
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
      targetRideId = body.riderRideId;
      updatedRiderId = body.riderId;
      updatedPassengerId = currentRide.passengerId;
    }

    // Verify the target ride exists
    const targetRide = await this.prisma.ride.findUnique({
      where: { id: targetRideId },
      include: {
        createdByUser: true,
        rider: true,
      },
    });

    if (!targetRide) {
      throw new NotFoundException('Target ride not found');
    }

    // Generate a unique match group ID for these paired rides
    const matchGroupId = randomUUID();

    // Update both rides with confirmed status and proper rider/passenger assignments
    await this.prisma.ride.updateMany({
      where: { id: { in: [rideId, targetRideId] } },
      data: {
        status: RIDE_STATUS.CONFIRMED,
        riderId: updatedRiderId,
        passengerId: updatedPassengerId,
        matchGroupId: matchGroupId,
      },
    });

    // Now connect the passenger to both rides in the many-to-many relationship
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        passengers: {
          connect: { id: updatedPassengerId },
        },
      },
    });

    await this.prisma.ride.update({
      where: { id: targetRideId },
      data: {
        passengers: {
          connect: { id: updatedPassengerId },
        },
      },
    });

    this.logger.log({
      level: 'info',
      message: `Confirmed matched rides`,
      tag: 'ride',
      rideIds: [rideId, targetRideId],
      riderId: updatedRiderId,
      passengerId: updatedPassengerId,
    });

    // Fetch the updated rides
    const updatedRides = await this.prisma.ride.findMany({
      where: { id: { in: [rideId, targetRideId] } },
      include: {
        createdByUser: true,
        rider: true,
        passengers: true,
      },
    });

    // Notify clients about the confirmation
    for (const confirmedRide of updatedRides) {
      this.rideGateway.notifyRideConfirmation(confirmedRide);
    }

    return {
      message: 'Rides confirmed successfully',
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
  async completeRide(
    @Param('id') id: string,
    @Body() body: { userId: number },
  ) {
    const rideId = Number(id);

    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { passengers: true, rider: true, createdByUser: true },
    });

    if (!ride) {
      this.logger.log({
        level: 'warn',
        message: `Complete ride failed: Ride not found`,
        tag: 'ride',
        rideId,
      });
      throw new NotFoundException('Ride not found');
    }

    // Verify that the user is part of this ride
    const isRider = ride.riderId === body.userId;
    const isPassenger = ride.passengerId === body.userId;

    if (!isRider && !isPassenger) {
      throw new BadRequestException(
        'You are not authorized to complete this ride',
      );
    }

    if (ride.status !== RIDE_STATUS.CONFIRMED) {
      this.logger.log({
        level: 'warn',
        message: `Complete ride failed: Ride not confirmed`,
        tag: 'ride',
        rideId,
        status: ride.status,
      });
      throw new BadRequestException('Only confirmed rides can be completed');
    }

    let distance: number | null = null;
    if (
      typeof ride.fromLat === 'number' &&
      typeof ride.fromLng === 'number' &&
      typeof ride.toLat === 'number' &&
      typeof ride.toLng === 'number'
    ) {
      distance = haversineDistance(
        ride.fromLat,
        ride.fromLng,
        ride.toLat,
        ride.toLng,
      );
    }

    const co2Saved =
      typeof distance === 'number' ? estimateCO2FromDistance(distance) : null;
    const peopleImpacted = ride.passengers.length;

    // Update ALL rides in the same match group to COMPLETED status
    let updatedRides: any[];
    if (ride.matchGroupId) {
      // Update all rides with the same matchGroupId
      await this.prisma.ride.updateMany({
        where: { matchGroupId: ride.matchGroupId },
        data: {
          status: RIDE_STATUS.COMPLETED,
          distance,
          co2Saved,
          peopleImpacted,
        },
      });

      // Fetch the updated rides for response
      updatedRides = await this.prisma.ride.findMany({
        where: { matchGroupId: ride.matchGroupId },
        include: {
          passengers: true,
          rider: true,
          createdByUser: true,
        },
      });
    } else {
      // Fallback: update only the current ride if no matchGroupId
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
          createdByUser: true,
        },
      });
      updatedRides = [updatedRide];
    }

    this.logger.log({
      level: 'info',
      message: `Ride(s) completed by user ${body.userId}`,
      tag: 'ride',
      rideId,
      completedByUserId: body.userId,
      isRider,
      isPassenger,
      distance,
      co2Saved,
      peopleImpacted,
      matchGroupId: ride.matchGroupId,
      updatedRideCount: updatedRides.length,
    });

    // Notify both users via socket that the ride is completed and they should show feedback modal
    // Use the first ride for notification (both should have same essential data)
    this.rideGateway.notifyRideCompletion(updatedRides[0]);

    return {
      message:
        'Ride completed successfully. Both users should now provide feedback.',
      ride: updatedRides[0], // Return the first ride (both should have same essential data)
      totalRidesUpdated: updatedRides.length,
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
    this.logger.log({
      level: 'info',
      message: `Ride rejected`,
      tag: 'ride',
      rideId: id,
      userId: body.userId,
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
    this.logger.log({
      level: 'info',
      message: `Ride cancelled`,
      tag: 'ride',
      rideId: id,
      userId: body.userId,
    });
    return {
      message: 'Ride cancelled. You can now post a new ride.',
      rideId: id,
      userId: body.userId,
      ride,
    };
  }

  // Get current user's active ride with expiry information
  @Get('user/:userId/current')
  async getCurrentUserRide(@Param('userId', ParseIntPipe) userId: number) {
    // First expire any old rides
    await this.expireOldRides();

    const activeRide = await this.prisma.ride.findFirst({
      where: {
        createdBy: userId,
        status: RIDE_STATUS.ACTIVE,
      },
      include: {
        rider: true,
        createdByUser: true,
        passengers: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!activeRide) {
      return { hasActiveRide: false, ride: null };
    }

    // Calculate expiry information
    const now = getNow();
    const rideCreationTime = new Date(activeRide.timestamp);

    const remainingTimeSeconds =
      this.calculateRemainingTimeSeconds(rideCreationTime);

    // Calculate the exact expiry time for logging purposes
    const expiryTime = new Date(
      rideCreationTime.getTime() + RIDE_EXPIRATION_GRACE_MINUTES * 60 * 1000,
    );

    const rideWithExpiry = {
      ...activeRide,
      expiryTimeSeconds: this.calculateExpiryTimeSeconds(),
      remainingTimeSeconds,
    };

    this.logger.log({
      level: 'info',
      message: `Current ride fetched for user`,
      tag: 'ride',
      userId,
      rideId: activeRide.id,
      rideCreationTime: rideCreationTime.toISOString(),
      expiryTime: expiryTime.toISOString(),
      now: now.toISOString(),
      remainingSeconds: remainingTimeSeconds,
      status: activeRide.status,
    });

    return { hasActiveRide: true, ride: rideWithExpiry };
  }

  /**
   * Helper method to expire old rides
   */
  private async expireOldRides(): Promise<void> {
    const now = getNow();
    // Calculate the cutoff time: rides created before (now - GRACE_MINUTES) should be expired
    const cutoffTime = new Date(
      now.getTime() - RIDE_EXPIRATION_GRACE_MINUTES * 60 * 1000,
    );

    const ridesToExpire = await this.prisma.ride.findMany({
      where: {
        status: { in: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED] }, // Expire both ACTIVE and CONFIRMED rides
        timestamp: { lt: cutoffTime },
      },
      select: { id: true, timestamp: true, createdBy: true, status: true },
    });

    if (ridesToExpire.length > 0) {
      this.logger.log({
        level: 'info',
        message: `Expiring ${ridesToExpire.length} old rides`,
        tag: 'ride',
        now: now.toISOString(),
        cutoffTime: cutoffTime.toISOString(),
        graceMinutes: RIDE_EXPIRATION_GRACE_MINUTES,
        ridesToExpire: ridesToExpire.map((r) => ({
          id: r.id,
          createdBy: r.createdBy,
          timestamp: r.timestamp.toISOString(),
          status: r.status,
        })),
      });
    }

    await this.prisma.ride.updateMany({
      where: {
        status: { in: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED] }, // Expire both ACTIVE and CONFIRMED rides
        timestamp: { lt: cutoffTime },
      },
      data: { status: RIDE_STATUS.EXPIRED },
    });
  }

  /**
   * Calculate total expiry time in seconds for a ride
   * This represents the grace period (in seconds) after which a ride is considered expired.
   * @returns Total expiry time in seconds
   */
  private calculateExpiryTimeSeconds(): number {
    // Rides expire RIDE_EXPIRATION_GRACE_MINUTES after their creation time
    return RIDE_EXPIRATION_GRACE_MINUTES * 60; // Convert minutes to seconds
  }

  /**
   * Calculate remaining time in seconds before ride expires
   * @param rideCreationTimestamp The ride's creation timestamp
   * @returns Remaining seconds until expiry (0 if expired)
   */
  private calculateRemainingTimeSeconds(rideCreationTimestamp: Date): number {
    const now = getNow();
    // Rides expire RIDE_EXPIRATION_GRACE_MINUTES after their CREATION time, not scheduled time
    const expiryTime = new Date(
      rideCreationTimestamp.getTime() +
        RIDE_EXPIRATION_GRACE_MINUTES * 60 * 1000,
    );

    const remainingMs = expiryTime.getTime() - now.getTime();

    return Math.max(0, Math.floor(remainingMs / 1000)); // Return 0 if expired
  }
}
