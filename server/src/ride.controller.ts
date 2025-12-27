import { randomUUID } from 'crypto';

import {
  Get,
  Put,
  Post,
  Body,
  Query,
  Param,
  Delete,
  Inject,
  Request,
  Controller,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { Ride, User, Feedback } from 'generated/prisma';

import { PrismaService } from './prisma.service';
import { KarmaCalculationService } from './services/karma-calculation.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

import { RideGateway } from './rides/rides.gateway';

import { UpdateRideDto } from './dto/update-ride.dto';

import {
  USER_ROLE,
  RIDE_STATUS,
  FEEDBACK_EMOJI,
  RIDE_MATCH_WINDOW_MINUTES,
  RIDE_EXPIRATION_GRACE_MINUTES,
} from './constants/enums';
import { TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING } from './constants/constants';

import {
  RideDto,
  FeedbackDto,
  ConfirmRideDto,
  AverageScoreResult,
  KarmaCalculationResult,
  AuthenticatedRequest,
} from './interfaces/types';

import {
  calculateETA,
  haversineDistance,
  MAX_RIDE_PROXIMITY_KM,
  estimateCO2FromDistance,
} from './utils/rideStats.util';
import { getNow } from './utils/date.util';
import { getTimeWindow } from './utils/timeWindow.util';
import { processFeedbackData } from './utils/feedback.util';

@Controller('rides')
export class RideController {
  // TODO (data_exposure_security): CRITICAL SECURITY AUDIT REQUIRED
  //
  // PROBLEM: Most endpoints in this controller return raw Prisma objects which expose
  // sensitive database fields and complete user relations to the frontend/API consumers.
  //
  // EXPOSED DATA INCLUDES:
  // - Database internal IDs (id, createdAt, updatedAt)
  // - Complete User objects with: emails, password hashes, phone numbers, addresses
  // - Internal karma/credit scores, transaction history
  // - Private ride messages, ratings, requests
  // - System timestamps and audit trails
  //
  // AFFECTED ENDPOINTS:
  // - GET /rides (public ride listings) - exposes all user data in ride relations
  // - GET /rides/match - exposes user data in matched rides
  // - GET /rides/history - exposes complete user history with all relations
  // - GET /rides/:id - exposes everything including messages, ratings, requests
  // - POST /rides - exposes full ride object after creation
  // - POST /rides/:id/confirm - exposes full user objects in confirmed rides
  // - POST /rides/:id/complete - exposes complete ride data
  // - GET /rides/user/:userId/current - exposes full current ride with all user data
  //
  // SOLUTION: Create proper DTOs for each endpoint that map only safe, public fields:
  // - PublicRideDto (for listings) - basic ride info + safe user fields (name, rating only)
  // - RideDetailDto (for single ride) - more details but still filtered
  // - RideHistoryDto (for history) - historical data without sensitive fields
  // - CurrentRideDto (for current ride) - essential fields only
  //
  // PRIORITY: CRITICAL - This is a major security vulnerability
  // IMPACT: All user data is potentially exposed to any API consumer
  // TIMELINE: Should be fixed before production deployment
  //

  // TODO (authentication_security): CRITICAL AUTHENTICATION SYSTEM MISSING
  //
  // PROBLEM: This application lacks proper JWT authentication, causing severe security vulnerabilities.
  // Multiple endpoints trust client-provided userId values without any authentication verification.
  //
  // MISSING AUTHENTICATION AFFECTS:
  // - POST /rides/:id/complete - trusts body.userId for ride completion authorization
  // - POST /rides/:id/reject - trusts body.userId for ride rejection authorization
  // - POST /rides/:id/cancel - trusts body.userId for ride cancellation authorization
  // - POST /rides/feedback - trusts body.fromUserId for feedback submission authorization
  //
  // SECURITY IMPACT:
  // - Any user can perform actions on behalf of other users
  // - Complete bypass of user authorization for critical ride management operations
  // - Manipulation of karma points, credit scores, and ride statistics
  // - Fraudulent feedback and rating manipulation
  //
  // REQUIRED IMPLEMENTATION:
  //
  // 1. INSTALL JWT AUTHENTICATION:
  //    npm install @nestjs/jwt @nestjs/passport passport passport-jwt
  //    npm install -D @types/passport-jwt
  //
  // 2. CREATE JWT MODULE (auth/jwt.module.ts):
  //    ```typescript
  //    import { Module } from '@nestjs/common';
  //    import { JwtModule } from '@nestjs/jwt';
  //    import { PassportModule } from '@nestjs/passport';
  //    import { JwtStrategy } from './jwt.strategy';
  //    import { JwtAuthGuard } from './jwt-auth.guard';
  //
  //    @Module({
  //      imports: [
  //        PassportModule,
  //        JwtModule.register({
  //          secret: process.env.JWT_SECRET,
  //          signOptions: { expiresIn: '24h' },
  //        }),
  //      ],
  //      providers: [JwtStrategy, JwtAuthGuard],
  //      exports: [JwtAuthGuard],
  //    })
  //    export class JwtAuthModule {}
  //    ```
  //
  // 3. CREATE JWT STRATEGY (auth/jwt.strategy.ts):
  //    ```typescript
  //    import { Injectable } from '@nestjs/common';
  //    import { PassportStrategy } from '@nestjs/passport';
  //    import { ExtractJwt, Strategy } from 'passport-jwt';
  //
  //    @Injectable()
  //    export class JwtStrategy extends PassportStrategy(Strategy) {
  //      constructor() {
  //        super({
  //          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  //          ignoreExpiration: false,
  //          secretOrKey: process.env.JWT_SECRET,
  //        });
  //      }
  //
  //      async validate(payload: any) {
  //        return { userId: payload.sub, email: payload.email };
  //      }
  //    }
  //    ```
  //
  // 4. UPDATE AUTH CONTROLLER to issue JWT tokens on login/signup
  //
  // 5. PROTECT VULNERABLE ENDPOINTS:
  //    ```typescript
  //    import { UseGuards, Request } from '@nestjs/common';
  //    import { JwtAuthGuard } from './auth/jwt-auth.guard';
  //
  //    @UseGuards(JwtAuthGuard)
  //    @Post(':id/complete')
  //    async completeRide(@Param('id') id: string, @Request() req: any) {
  //      const authenticatedUserId = req.user.userId; // From JWT token
  //      // Remove body.userId parameter completely
  //      // Use authenticatedUserId for all authorization checks
  //    }
  //    ```
  //
  // 6. REMOVE userId FROM REQUEST BODIES:
  //    - Remove { userId: number } from all @Body() parameters
  //    - Extract user ID from JWT authentication context only
  //    - Update frontend to send JWT tokens in Authorization header
  //
  // PRIORITY: CRITICAL - Must be implemented before production deployment
  // ESTIMATED EFFORT: 1-2 days for complete authentication system implementation
  //
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

  // TODO: this informations is already available on userDetails endpoint, consider removing this endpoint and using that one instead
  @Get('/user/:id/credit-score')
  /**
   * Retrieves the credit score for a user by their ID.
   *
   * @param id - The ID of the user as a string.
   * @returns An object containing the user's credit score.
   * @throws {BadRequestException} If the provided ID is missing or invalid.
   * @throws {NotFoundException} If the user with the given ID does not exist.
   *
   * TODO (refactor priority):
   *   - Annotate return type with DTO (GetCreditScoreResponseDto)
   *   - Add @Throttle() decorator for rate limiting
   *   - Consider access control/auth guard for this endpoint
   */
  async getUserCreditScore(@Param('id', ParseIntPipe) userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditScore: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { creditScore: user.creditScore };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/feedback')
  /**
   * Submit feedback for a completed ride
   * Updates karma points for riders and credit score for passengers
   * Now protected with JWT authentication - fromUserId comes from authenticated user
   */
  async submitFeedback(
    @Body() body: Omit<FeedbackDto, 'fromUserId'>,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId; // From JWT token

    this.logger.log({
      level: 'info',
      message: `Feedback submission attempt for ride ${body.rideId} from authenticated user ${authenticatedUserId} to user ${body.toUserId}`,
      tag: 'feedback',
      rideId: body.rideId,
      fromUserId: authenticatedUserId,
      toUserId: body.toUserId,
      role: body.role,
      emoji: body.emoji,
    });

    // Validate required fields (fromUserId comes from JWT, not body)
    if (
      !body.rideId ||
      !body.toUserId ||
      !body.role ||
      body.emoji === undefined ||
      body.emoji === null
    ) {
      throw new BadRequestException('Missing required feedback fields');
    }

    const validFeedbackRatings = Object.values(FEEDBACK_EMOJI);

    if (!validFeedbackRatings.includes(body.emoji)) {
      throw new BadRequestException(
        `Invalid feedback rating. Must be one of: ${validFeedbackRatings.join(', ')} (0=Satisfied, 1=Neutral, 2=Dissatisfied)`,
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

    // Verify that authenticated user is part of this ride
    const isRider = ride.riderId === authenticatedUserId;
    const isPassenger = ride.passengerId === authenticatedUserId;

    if (!isRider && !isPassenger) {
      throw new BadRequestException('User is not part of this ride');
    }

    // Check for duplicate feedback
    let existingFeedback: Feedback | null;
    try {
      existingFeedback = await this.prisma.feedback.findFirst({
        where: {
          rideId: body.rideId,
          fromUserId: authenticatedUserId,
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
    let feedback: Feedback;
    try {
      feedback = await this.prisma.feedback.create({
        data: {
          rideId: body.rideId,
          fromUserId: authenticatedUserId,
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

    const rideDistance = ride.distance;

    if (!rideDistance) {
      this.logger.log({
        level: 'warn',
        message: `Distance not found for completed ride (rideId=${body.rideId}, status=${ride.status})`,
        tag: 'feedback',
        rideId: body.rideId,
        rideStatus: ride.status,
      });
    }

    const karmaResult: KarmaCalculationResult =
      KarmaCalculationService.calculateKarmaPoints({
        distance: rideDistance,
        feedbackRating: body.emoji,
      });

    const totalPoints = karmaResult.totalPoints;

    this.logger.log({
      level: 'info',
      message: `Karma calculation completed using ${TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING} algorithm`,
      tag: 'feedback',
      rideId: body.rideId,
      fromUserId: authenticatedUserId,
      algorithm: TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING,
      calculation: {
        distance: rideDistance,
        rating: body.emoji,
        ratingDescription: KarmaCalculationService.getFeedbackRatingDescription(
          body.emoji,
        ),
        distanceTier: karmaResult.distanceTier,
        distanceMultiplier: karmaResult.distanceMultiplier,
        sentimentBonus: karmaResult.sentimentBonus,
        totalPoints: karmaResult.totalPoints,
        formula: karmaResult.formula,
      },
    });

    // Update user scores based on their role
    if (body.role === USER_ROLE.RIDER) {
      // Update rider's karma points
      await this.prisma.user.update({
        where: { id: authenticatedUserId },
        data: { karmaPoints: { increment: totalPoints } },
      });

      // Create karma transaction
      await this.prisma.karmaTransaction.create({
        data: {
          userId: authenticatedUserId,
          points: totalPoints,
          type: 'earned',
          reason: `Ride feedback: ${KarmaCalculationService.getFeedbackRatingDescription(body.emoji)} | Distance: ${rideDistance || 'N/A'}km | Points: ${totalPoints}`,
        },
      });

      this.logger.log({
        level: 'info',
        message: `Karma points awarded to rider using distance-based algorithm`,
        tag: 'feedback',
        userId: authenticatedUserId,
        role: 'rider',
        rideId: body.rideId,
        algorithm: TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING,
        points: totalPoints,
        calculation: {
          distance: rideDistance,
          distanceTier: karmaResult.distanceTier,
          basePoints: karmaResult.basePoints,
          distanceMultiplier: karmaResult.distanceMultiplier,
          sentimentBonus: karmaResult.sentimentBonus,
          formula: karmaResult.formula,
        },
      });
    } else if (body.role === USER_ROLE.PASSENGER) {
      // Update passenger's credit score
      await this.prisma.user.update({
        where: { id: authenticatedUserId },
        data: { creditScore: { increment: totalPoints } },
      });

      this.logger.log({
        level: 'info',
        message: `Credit score awarded to passenger using distance-based algorithm`,
        tag: 'feedback',
        userId: authenticatedUserId,
        role: 'passenger',
        rideId: body.rideId,
        algorithm: TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING,
        points: totalPoints,
        calculation: {
          distance: rideDistance,
          distanceTier: karmaResult.distanceTier,
          basePoints: karmaResult.basePoints,
          distanceMultiplier: karmaResult.distanceMultiplier,
          sentimentBonus: karmaResult.sentimentBonus,
          formula: karmaResult.formula,
        },
      });
    }

    // Check if both users have submitted feedback to determine response
    const allFeedback = await this.prisma.feedback.findMany({
      where: { rideId: body.rideId },
    });

    const riderFeedback = allFeedback.find(
      (f) => (f.role as USER_ROLE) === USER_ROLE.RIDER,
    );
    const passengerFeedback = allFeedback.find(
      (f) => (f.role as USER_ROLE) === USER_ROLE.PASSENGER,
    );

    // Since ride is already completed, check if both users have now submitted feedback
    const bothSubmitted = riderFeedback && passengerFeedback;

    // Get updated user data to return
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: authenticatedUserId },
      select: { id: true, karmaPoints: true, creditScore: true },
    });

    return {
      message: 'Feedback submitted successfully',
      // Explicitly map Prisma Feedback model to FeedbackDto to ensure only expose intended fields (exclude id, createdAt, user objects, etc.)
      feedback: {
        rideId: feedback.rideId,
        fromUserId: feedback.fromUserId,
        toUserId: feedback.toUserId,
        role: feedback.role as USER_ROLE,
        emoji: feedback.emoji as FEEDBACK_EMOJI,
        comment: feedback.comment,
      } as FeedbackDto,
      pointsAwarded: totalPoints,
      karmaCalculation: {
        algorithm: TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING,
        distance: rideDistance,
        distanceTier: karmaResult.distanceTier,
        distanceTierDescription:
          KarmaCalculationService.getDistanceTierDescription(
            karmaResult.distanceTier,
          ),
        basePoints: karmaResult.basePoints,
        distanceMultiplier: karmaResult.distanceMultiplier,
        sentimentBonus: karmaResult.sentimentBonus,
        totalPoints: karmaResult.totalPoints,
        formula: karmaResult.formula,
        breakdown: karmaResult.breakdown,
      },
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
    // TODO (data_exposure_security): CRITICAL - matchedRides contains full Prisma objects with sensitive data
    // Potential exposure: user emails, passwords (if included), internal IDs, timestamps, etc.
    // Fix: Create proper RideDto mapping that only exposes safe fields
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createRide(
    @Body() body: Omit<RideDto, 'createdBy'>,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    this.logger.log({
      level: 'info',
      message: `Create ride attempt by userId=${authenticatedUserId}, from='${body.from}' to='${body.to}', role='${body.role}'`,
      tag: 'ride',
      userId: authenticatedUserId,
      from: body.from,
      to: body.to,
      role: body.role,
    });
    if (!body.from || !body.to || !body.role) {
      throw new BadRequestException('Missing required fields');
    }
    // Fetch user and check role
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUserId },
    });
    if (!user) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: User not found (userId=${authenticatedUserId})`,
        tag: 'ride',
        userId: authenticatedUserId,
      });
      throw new NotFoundException('User not found');
    }
    // Case-insensitive role check
    if (user.role.toLowerCase() !== body.role.toLowerCase()) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: Role mismatch for userId=${authenticatedUserId} (userRole='${user.role}', requestedRole='${body.role}')`,
        tag: 'ride',
        userId: authenticatedUserId,
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
        createdBy: authenticatedUserId,
        status: { in: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED] },
      },
    });
    if (existingActiveRide) {
      this.logger.log({
        level: 'warn',
        message: `Ride creation failed: UserId=${authenticatedUserId} already has an active or confirmed ride`,
        tag: 'ride',
        userId: authenticatedUserId,
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
      riderId = authenticatedUserId;
      passengerId = null;
    } else if (body.role.toLowerCase() === USER_ROLE.PASSENGER.toLowerCase()) {
      riderId = null;
      passengerId = authenticatedUserId;
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
        createdBy: authenticatedUserId,
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
      message: `Ride created by userId=${authenticatedUserId}: ${JSON.stringify(ride)}`,
      tag: 'ride',
      userId: authenticatedUserId,
      rideId: ride.id,
    });
    return { message: 'Ride created', ride };
    // TODO (data_exposure_security): CRITICAL - Full Prisma Ride object exposed
    // Potential exposure: internal database IDs, creation timestamps, user objects with sensitive data
    // Fix: Map to safe RideDto fields only
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
    // TODO (data_exposure_security): CRITICAL - ridesWithExpiry contains full Prisma objects with sensitive data
    // Potential exposure: user emails, passwords, phone numbers, addresses, internal IDs, etc.
    // Fix: Create proper RideDto mapping for public ride listings
  }

  // Get all ride history for a user (as rider or passenger)
  // TODO: Infinite scroll backend checklist:
  //   1. Add pagination support to /rides/history endpoint (accept page, limit params)
  //   2. Return total count or hasMore flag in response
  //   3. Optimize query for large datasets (indexes, limits)
  //   4. Document API changes for frontend
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getRideHistory(
    @Query('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    const userIdNum = Number(userId);
    if (!userId || isNaN(userIdNum)) {
      this.logger.log({
        level: 'warn',
        message: `Ride history fetch failed: Invalid userId`,
        tag: 'ride',
        userId,
      });
      throw new BadRequestException('Valid userId is required');
    }
    // Verify user can only fetch their own history
    if (userIdNum !== authenticatedUserId) {
      this.logger.log({
        level: 'warn',
        message: `Get ride history denied: userId=${authenticatedUserId} attempted to fetch history for userId=${userIdNum}`,
        tag: 'ride',
        authenticatedUserId,
        requestedUserId: userIdNum,
      });
      throw new ForbiddenException('You can only fetch your own ride history');
    }
    // Expire old rides using the centralized helper
    await this.expireOldRides();

    this.logger.log({
      level: 'info',
      message: `Expired rides older than grace period for history fetch`,
      tag: 'ride',
      timestamp: getNow(),
      userId,
    });
    const rides = await this.prisma.ride.findMany({
      where: {
        OR: [
          { riderId: userIdNum },
          { passengerId: userIdNum },
          { createdBy: userIdNum },
        ],
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
    // TODO (data_exposure_security): CRITICAL - uniqueRides contains full Prisma objects with ALL user data
    // Potential exposure: user emails, passwords, phone, addresses, karma points, credit scores, etc.
    // Fix: Create RideHistoryDto with only safe fields for ride history
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
    // TODO (data_exposure_security): CRITICAL - Full Prisma Ride object with ALL included relations exposed
    // Potential exposure: Complete user objects (rider, passengers, createdByUser) with emails, passwords, etc.
    // Also exposes: requests, ratings, messages which may contain sensitive data
    // Fix: Create detailed RideDetailDto that maps only safe fields from relations
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateRide(
    @Param('id') id: string,
    @Body() updates: UpdateRideDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    // Verify user owns the ride before updating
    const existingRide = await this.prisma.ride.findUnique({
      where: { id: Number(id) },
    });
    if (!existingRide) {
      throw new NotFoundException('Ride not found');
    }
    if (existingRide.createdBy !== authenticatedUserId) {
      this.logger.log({
        level: 'warn',
        message: `Update ride denied: userId=${authenticatedUserId} does not own ride ${id}`,
        tag: 'ride',
        userId: authenticatedUserId,
        rideId: id,
      });
      throw new ForbiddenException('You can only update your own rides');
    }
    const ride = await this.prisma.ride.update({
      where: { id: Number(id) },
      data: updates,
    });
    this.logger.log({
      level: 'info',
      message: `Ride updated`,
      tag: 'ride',
      userId: authenticatedUserId,
      rideId: id,
      updates,
    });
    return { message: 'Ride updated', ride };
    // TODO (data_exposure_security): CRITICAL - Full updated Prisma Ride object exposed
    // Potential exposure: internal database fields, timestamps, related user data
    // Fix: Map to safe RideDto fields only
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteRide(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    // Verify user owns the ride before deleting
    const existingRide = await this.prisma.ride.findUnique({
      where: { id: Number(id) },
    });
    if (!existingRide) {
      throw new NotFoundException('Ride not found');
    }
    if (existingRide.createdBy !== authenticatedUserId) {
      this.logger.log({
        level: 'warn',
        message: `Delete ride denied: userId=${authenticatedUserId} does not own ride ${id}`,
        tag: 'ride',
        userId: authenticatedUserId,
        rideId: id,
      });
      throw new ForbiddenException('You can only delete your own rides');
    }
    this.logger.log({
      level: 'warn',
      message: `Deleting ride with id: ${id}`,
      tag: 'ride',
      userId: authenticatedUserId,
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
  @UseGuards(JwtAuthGuard)
  async confirmRide(
    @Param('id') id: string,
    @Body() body: ConfirmRideDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
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

    // Verify user owns the current ride they're confirming from
    if (currentRide.createdBy !== authenticatedUserId) {
      this.logger.log({
        level: 'warn',
        message: `Confirm ride denied: userId=${authenticatedUserId} does not own ride ${id}`,
        tag: 'ride',
        userId: authenticatedUserId,
        rideId: id,
      });
      throw new ForbiddenException('You can only confirm your own rides');
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
    // TODO (data_exposure_security): CRITICAL - updatedRides contains full Prisma objects with ALL user data
    // Potential exposure: Complete user objects (rider, passengers, createdByUser) with sensitive information
    // Fix: Create ConfirmedRideDto that maps only safe fields from confirmed rides
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  async completeRide(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId; // From JWT token
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

    // Verify that the authenticated user is part of this ride
    const isRider = ride.riderId === authenticatedUserId;
    const isPassenger = ride.passengerId === authenticatedUserId;

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
    let updatedRides: (Ride & {
      passengers: User[];
      rider: User | null;
      createdByUser: User | null;
    })[];
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
      message: `Ride(s) completed by authenticated user ${authenticatedUserId}`,
      tag: 'ride',
      rideId,
      completedByUserId: authenticatedUserId,
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
    this.rideGateway.notifyRideCompletion(updatedRides[0] as Ride);

    return {
      message:
        'Ride completed successfully. Both users should now provide feedback.',
      ride: updatedRides[0], // Return the first ride (both should have same essential data)
      totalRidesUpdated: updatedRides.length,
    };
    // TODO (data_exposure_security): CRITICAL - updatedRides[0] contains full Prisma object with ALL user data
    // Potential exposure: Complete user objects (passengers, rider, createdByUser) with sensitive data
    // Fix: Create CompletedRideDto that maps only safe fields
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  async rejectRide(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId; // From JWT token

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
      userId: authenticatedUserId,
    });

    return {
      message: 'Ride rejected. You can now post a new ride.',
      rideId: id,
      userId: authenticatedUserId,
      ride,
    };
    // TODO (data_exposure_security): MEDIUM - ride object contains Prisma fields that may not be needed
    // Potential exposure: internal database fields, timestamps
    // Fix: Return minimal ride info or just confirmation message
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelRide(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId; // From JWT token

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
      userId: authenticatedUserId,
    });

    return {
      message: 'Ride cancelled. You can now post a new ride.',
      rideId: id,
      userId: authenticatedUserId,
      ride,
    };
    // TODO (data_exposure_security): MEDIUM - ride object contains Prisma fields that may not be needed
    // Potential exposure: internal database fields, timestamps
    // Fix: Return minimal ride info or just confirmation message
  }

  // Get current user's active ride with expiry information
  @Get('user/:userId/current')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserRide(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    // Verify user can only fetch their own ride
    if (userId !== authenticatedUserId) {
      this.logger.log({
        level: 'warn',
        message: `Get current ride denied: userId=${authenticatedUserId} attempted to fetch ride for userId=${userId}`,
        tag: 'ride',
        authenticatedUserId,
        requestedUserId: userId,
      });
      throw new ForbiddenException('You can only fetch your own ride');
    }
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
    // TODO (data_exposure_security): CRITICAL - rideWithExpiry contains full Prisma object with ALL user data
    // Potential exposure: Complete user objects (rider, createdByUser, passengers) with emails, passwords, etc.
    // Fix: Create CurrentRideDto that maps only essential fields for current ride display
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

  @Get('/user/:userId/average-score')
  /**
   * Get average feedback score for a user
   * Calculates the average emoji feedback received by a user across all rides
   * @param userId The user ID to calculate average score for
   * @returns Object containing average score, total feedback count, and emoji breakdown
   */
  async getUserAverageScore(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<AverageScoreResult> {
    this.logger.log({
      level: 'info',
      message: `Getting average score for user ${userId}`,
      tag: 'average-score',
      userId,
    });

    try {
      // Get all feedback received by this user
      const feedbackReceived = await this.prisma.feedback.findMany({
        where: { toUserId: userId },
        select: { emoji: true },
      });

      // Use utility function to process the feedback data
      const result = processFeedbackData(feedbackReceived, this.logger);

      this.logger.log({
        level: 'info',
        message: `Average score calculated for user ${userId}: ${result.averageScore}`,
        tag: 'average-score',
        userId,
        averageScore: result.averageScore,
        totalFeedback: result.totalFeedback,
      });

      return result;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: `Error calculating average score for user ${userId}`,
        tag: 'average-score',
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw new BadRequestException('Error calculating average score');
    }
  }

  @Get('/user/:userId/people-impacted')
  /**
   * Get people impacted by a user (users they've ridden with and ride counts)
   * Returns users ranked by number of rides completed together
   * Properly handles matchGroupId to avoid double-counting matched rides
   * @param userId The user ID to get people impacted data for
   * @returns Object containing people array and total count
   */
  async getPeopleImpacted(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{
    people: Array<{
      id: number;
      name: string;
      img: string;
      rideCount: number;
    }>;
    totalImpacted: number;
  }> {
    try {
      // Get all completed rides where user was involved (as rider or passenger)
      const allRides = await this.prisma.ride.findMany({
        where: {
          status: RIDE_STATUS.COMPLETED,
          OR: [{ riderId: userId }, { passengerId: userId }],
        },
        select: {
          id: true,
          riderId: true,
          passengerId: true,
          matchGroupId: true,
        },
      });

      // Deduplicate rides by matchGroupId to avoid counting matched rides twice
      const uniqueRides = new Map<string, (typeof allRides)[0]>();

      allRides.forEach((ride) => {
        if (ride.matchGroupId) {
          // If ride has matchGroupId, use it as key to deduplicate
          if (!uniqueRides.has(ride.matchGroupId)) {
            uniqueRides.set(ride.matchGroupId, ride);
          }
        } else {
          // If no matchGroupId, use ride ID as unique key
          uniqueRides.set(`ride_${ride.id}`, ride);
        }
      });

      // Count partners from deduplicated rides
      const partnerCounts = new Map<number, number>();

      Array.from(uniqueRides.values()).forEach((ride) => {
        let partnerId: number | null = null;

        if (ride.riderId === userId && ride.passengerId) {
          // User was rider, partner is passenger
          partnerId = ride.passengerId;
        } else if (ride.passengerId === userId && ride.riderId) {
          // User was passenger, partner is rider
          partnerId = ride.riderId;
        }

        if (partnerId) {
          const current = partnerCounts.get(partnerId) || 0;
          partnerCounts.set(partnerId, current + 1);
        }
      });

      // Get user details for all partners
      const partnerIds = Array.from(partnerCounts.keys());

      if (partnerIds.length === 0) {
        return { people: [], totalImpacted: 0 };
      }

      const partnerUsers = await this.prisma.user.findMany({
        where: {
          id: { in: partnerIds },
        },
        select: {
          id: true,
          fullname: true,
          profilePicture: true,
        },
      });

      // Combine user data with ride counts and sort
      const people = partnerUsers
        .map((user) => ({
          id: user.id,
          name: user.fullname,
          img: user.profilePicture || '',
          rideCount: partnerCounts.get(user.id) || 0,
        }))
        .sort((a, b) => b.rideCount - a.rideCount);

      this.logger.log({
        level: 'info',
        message: `People impacted data fetched for user ${userId}`,
        tag: 'ride',
        userId,
        totalRidesFound: allRides.length,
        uniqueRidesAfterDedup: uniqueRides.size,
        totalImpacted: people.length,
        topPartners: people.slice(0, 3).map((p) => ({
          name: p.name,
          rides: p.rideCount,
        })),
      });

      return {
        people,
        totalImpacted: people.length,
      };
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: `Failed to fetch people impacted for user ${userId}`,
        tag: 'ride',
        userId,
        error: (error as Error).message,
      });
      throw new InternalServerErrorException(
        'Failed to fetch people impacted data',
      );
    }
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
