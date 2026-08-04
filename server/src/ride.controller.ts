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
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { PrismaService } from './prisma.service';
import { KarmaCalculationService } from './services/karma-calculation.service';
import { RideExpiryService } from './services/ride-expiry.service';
import { RideStatsService } from './services/ride-stats.service';
import { RideHistoryService } from './services/ride-history.service';
import { RideLifecycleService } from './services/ride-lifecycle.service';
import { RideMatchingService } from './services/ride-matching.service';
import { RideService } from './services/ride.service';
import { FeedbackService } from './services/feedback.service';
import { PeopleImpactedService } from './services/people-impacted.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './auth/optional-jwt-auth.guard';

import { RideGateway } from './rides/rides.gateway';

import { UpdateRideDto } from './dto/update-ride.dto';
import {
  CreateRideDto,
  ListRidesQueryDto,
  MatchRidesQueryDto,
} from './dto/create-ride.dto';
import {
  toRideDto,
  toRideDtoList,
  RIDE_WITH_PARTICIPANTS_SELECT,
} from './dto/ride-response.dto';
import {
  PaginationQueryDto,
  cursorFilter,
  decodeCursor,
  encodeCursor,
  resolveLimit,
} from './dto/pagination.dto';

import {
  USER_ROLE,
  RIDE_STATUS,
  RIDE_EXPIRATION_GRACE_MINUTES,
} from './constants/enums';
import { TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING } from './constants/constants';

import {
  FeedbackDto,
  ConfirmRideDto,
  AverageScoreResult,
  AuthenticatedRequest,
  OptionalAuthenticatedRequest,
} from './interfaces/types';

import { getNow } from './utils/date.util';
import { processFeedbackData } from './utils/feedback.util';

@Controller('rides')
export class RideController {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly rideGateway: RideGateway,
    private readonly rideStats: RideStatsService,
    private readonly rideHistory: RideHistoryService,
    private readonly rideLifecycle: RideLifecycleService,
    private readonly rideMatching: RideMatchingService,
    private readonly rideService: RideService,
    private readonly feedbackService: FeedbackService,
    private readonly peopleImpacted: PeopleImpactedService,
  ) {}

  /**
   * Rejects any attempt to read another user's private figures.
   * These endpoints are keyed by a sequential user id, so without this check
   * anyone could walk the range and harvest every account's scores.
   */
  private assertSelf(requestedUserId: number, authenticatedUserId: number) {
    if (requestedUserId !== authenticatedUserId) {
      this.logger.log({
        level: 'warn',
        message: `Denied cross-user access: userId=${authenticatedUserId} requested data for userId=${requestedUserId}`,
        tag: 'ride',
        authenticatedUserId,
        requestedUserId,
      });
      throw new ForbiddenException('You can only access your own data');
    }
  }

  @Get('/user/:id/karma-points')
  @UseGuards(JwtAuthGuard)
  /**
   * Retrieves the karma points for the authenticated user.
   *
   * @param id - The ID of the user as a string. Must match the caller.
   * @returns An object containing the user's karma points.
   * @throws {ForbiddenException} If the caller requests another user's points.
   * @throws {NotFoundException} If the user with the given ID does not exist.
   *
   * TODO (refactor priority):
   *   - Annotate return type with DTO (GetKarmaPointsResponseDto)
   *   - Add @Throttle() decorator for rate limiting
   */
  async getUserKarmaPoints(
    @Param('id', ParseIntPipe) userId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(userId, req.user.userId);
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
  @UseGuards(JwtAuthGuard)
  /**
   * Retrieves the credit score for the authenticated user.
   *
   * @param id - The ID of the user as a string. Must match the caller.
   * @returns An object containing the user's credit score.
   * @throws {ForbiddenException} If the caller requests another user's score.
   * @throws {NotFoundException} If the user with the given ID does not exist.
   *
   * TODO (refactor priority):
   *   - Annotate return type with DTO (GetCreditScoreResponseDto)
   *   - Add @Throttle() decorator for rate limiting
   */
  async getUserCreditScore(
    @Param('id', ParseIntPipe) userId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(userId, req.user.userId);
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
   * Submit feedback for a completed ride.
   * Credits karma to riders and credit score to passengers.
   */
  async submitFeedback(
    @Body() body: Omit<FeedbackDto, 'fromUserId'>,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.feedbackService.submit(req.user.userId, body);

    return {
      message: 'Feedback submitted successfully',
      feedback: result.feedback,
      pointsAwarded: result.pointsAwarded,
      karmaCalculation: {
        algorithm: TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING,
        distance: result.distance,
        distanceTier: result.karma.distanceTier,
        distanceTierDescription:
          KarmaCalculationService.getDistanceTierDescription(
            result.karma.distanceTier,
          ),
        basePoints: result.karma.basePoints,
        distanceMultiplier: result.karma.distanceMultiplier,
        sentimentBonus: result.karma.sentimentBonus,
        totalPoints: result.karma.totalPoints,
        formula: result.karma.formula,
        breakdown: result.karma.breakdown,
      },
      user: result.user,
      feedbackComplete: result.feedbackComplete,
      waitingForOtherUser: !result.feedbackComplete,
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
  async matchRides(@Query() query: MatchRidesQueryDto) {
    const matches = await this.rideMatching.findMatches(query);

    // Match results are always still ACTIVE, so participants are exposed as
    // public profiles only - no contact details before a ride is confirmed.
    return { rides: toRideDtoList(matches) };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createRide(
    @Body() body: CreateRideDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    const ride = await this.rideService.create(authenticatedUserId, body);

    return {
      message: 'Ride created',
      ride: toRideDto(ride, authenticatedUserId),
    };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getRides(
    @Request() req: OptionalAuthenticatedRequest,
    @Query() pagination: PaginationQueryDto,
    @Query() filter: ListRidesQueryDto,
  ) {
    const role = filter.role;
    const viewerId = req.user?.userId;
    const now = getNow();
    const limit = resolveLimit(pagination.limit);
    const cursor = decodeCursor(pagination.cursor);

    // Fetch one extra row: if it comes back there is a further page, and it
    // supplies the cursor without needing a second COUNT query.
    const rides = await this.prisma.ride.findMany({
      where: {
        ...(role ? { role } : {}),
        status: { in: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED] },
        timestamp: { gte: now },
        ...cursorFilter(cursor),
      },
      select: RIDE_WITH_PARTICIPANTS_SELECT,
      orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const page = rides.slice(0, limit);
    const nextCursor =
      rides.length > limit && page.length > 0
        ? encodeCursor(page[page.length - 1])
        : null;

    // Map to the safe projection, then add expiry information to each ride
    const ridesWithExpiry = page.map((ride) => ({
      ...toRideDto(ride, viewerId),
      expiryTimeSeconds: this.calculateExpiryTimeSeconds(),
      remainingTimeSeconds: this.calculateRemainingTimeSeconds(ride.timestamp),
    }));

    this.logger.log({
      level: 'info',
      message: `Fetched rides`,
      tag: 'ride',
      role,
      rideCount: page.length,
    });
    return { rides: ridesWithExpiry, nextCursor };
  }

  /**
   * Aggregate ride totals for the reflection dashboard.
   *
   * Kept separate from the history list so that history can be paginated
   * without the totals changing with the page size.
   */
  @Get('/user/:userId/stats')
  @UseGuards(JwtAuthGuard)
  async getUserRideStats(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(userId, req.user.userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.rideStats.getStatsForUser(userId, user.role as USER_ROLE);
  }

  // Get ride history for a user (as rider or passenger), newest first.
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getRideHistory(
    @Query('userId') userId: string,
    @Query() pagination: PaginationQueryDto,
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
    const limit = resolveLimit(pagination.limit);
    const cursor = decodeCursor(pagination.cursor);

    // One row per trip, already deduplicated and ordered by the database.
    const keys = await this.rideHistory.getTripKeys(userIdNum, cursor, limit);
    const pageKeys = keys.slice(0, limit);
    const nextCursor =
      keys.length > limit && pageKeys.length > 0
        ? encodeCursor(pageKeys[pageKeys.length - 1])
        : null;

    const rides = await this.prisma.ride.findMany({
      where: { id: { in: pageKeys.map((key) => key.id) } },
      select: RIDE_WITH_PARTICIPANTS_SELECT,
    });

    // `IN` does not preserve order, so restore the sequence the keys defined.
    const byId = new Map(rides.map((ride) => [ride.id, ride]));
    const uniqueRides = pageKeys
      .map((key) => byId.get(key.id))
      .filter((ride): ride is (typeof rides)[number] => ride !== undefined);

    this.logger.log({
      level: 'info',
      message: `Fetched ride history`,
      tag: 'ride',
      userId,
      rideCount: uniqueRides.length,
    });
    return {
      rides: toRideDtoList(uniqueRides, authenticatedUserId),
      nextCursor,
    };
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getRide(
    @Param('id') id: string,
    @Request() req: OptionalAuthenticatedRequest,
  ) {
    // The viewer is taken from the JWT only. A client-supplied userId cannot be
    // trusted to decide whose contact details are visible.
    const viewerId = req.user?.userId;
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
      select: RIDE_WITH_PARTICIPANTS_SELECT,
    });
    if (!ride) throw new NotFoundException('Ride not found');

    // Determine the role from the current user's perspective
    let userRole = ride.role; // Default to the original creator's role
    if (viewerId) {
      if (viewerId === ride.riderId) {
        userRole = USER_ROLE.RIDER;
      } else if (viewerId === ride.passengerId) {
        userRole = USER_ROLE.PASSENGER;
      }
    }

    this.logger.log({
      level: 'info',
      message: `Fetched ride details`,
      tag: 'ride',
      rideId,
      requestedByUser: viewerId,
      userRole,
    });

    return {
      ride: {
        ...toRideDto(ride, viewerId),
        role: userRole, // Override the role based on current user's perspective
      },
    };
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
    return {
      message: 'Ride updated',
      ride: toRideDto(ride, authenticatedUserId),
    };
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
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ConfirmRideDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    const rides = await this.rideLifecycle.confirm(
      id,
      body,
      authenticatedUserId,
    );

    return {
      message: 'Rides confirmed successfully',
      rides: toRideDtoList(rides, authenticatedUserId),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  async completeRide(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    const { rides } = await this.rideLifecycle.complete(
      id,
      authenticatedUserId,
    );

    return {
      message:
        'Ride completed successfully. Both users should now provide feedback.',
      // Both halves carry the same trip data; return the first.
      ride: toRideDto(rides[0], authenticatedUserId),
      totalRidesUpdated: rides.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  async rejectRide(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    const ride = await this.rideLifecycle.retire(
      id,
      RIDE_STATUS.REJECTED,
      authenticatedUserId,
    );

    return {
      message: 'Ride rejected. You can now post a new ride.',
      rideId: id,
      userId: authenticatedUserId,
      ride: toRideDto(ride, authenticatedUserId),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelRide(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    const ride = await this.rideLifecycle.retire(
      id,
      RIDE_STATUS.CANCELLED,
      authenticatedUserId,
    );

    return {
      message: 'Ride cancelled. You can now post a new ride.',
      rideId: id,
      userId: authenticatedUserId,
      ride: toRideDto(ride, authenticatedUserId),
    };
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
    const activeRide = await this.prisma.ride.findFirst({
      where: {
        createdBy: userId,
        status: RIDE_STATUS.ACTIVE,
        // Excludes rides the scheduled sweep has not yet marked EXPIRED.
        timestamp: { gte: RideExpiryService.expiryCutoff() },
      },
      select: RIDE_WITH_PARTICIPANTS_SELECT,
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
      ...toRideDto(activeRide, authenticatedUserId),
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

  @Get('/user/:userId/average-score')
  @UseGuards(JwtAuthGuard)
  /**
   * Get average feedback score for the authenticated user
   * Calculates the average emoji feedback received by a user across all rides
   * @param userId The user ID to calculate average score for. Must match the caller.
   * @returns Object containing average score, total feedback count, and emoji breakdown
   */
  async getUserAverageScore(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<AverageScoreResult> {
    this.assertSelf(userId, req.user.userId);
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
  @UseGuards(JwtAuthGuard)
  /**
   * People the authenticated user has completed rides with, ranked by count.
   *
   * Restricted to the caller's own data: this is effectively their social
   * graph, and exposing it by user id would let anyone map who rides with whom.
   */
  async getPeopleImpacted(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(userId, req.user.userId);

    return this.peopleImpacted.getForUser(userId);
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
