import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { PrismaService } from '../prisma.service';
import { USER_ROLE, RIDE_STATUS, FEEDBACK_EMOJI } from '../constants/enums';
import { TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING } from '../constants/constants';
import { FeedbackDto, KarmaCalculationResult } from '../interfaces/types';
import { KarmaCalculationService } from './karma-calculation.service';

export interface FeedbackResult {
  feedback: FeedbackDto;
  pointsAwarded: number;
  karma: KarmaCalculationResult;
  distance: number | null;
  user: { id: number; karmaPoints: number; creditScore: number } | null;
  feedbackComplete: boolean;
}

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  /**
   * Records one participant's feedback on a completed ride and credits the
   * resulting points.
   *
   * The submitter's role is derived from the ride itself rather than taken
   * from the request: the role decides which balance is credited, so accepting
   * it from the client would let a passenger claim the rider payout.
   */
  async submit(
    userId: number,
    body: Omit<FeedbackDto, 'fromUserId'>,
  ): Promise<FeedbackResult> {
    this.assertWellFormed(body);

    const ride = await this.prisma.ride.findUnique({
      where: { id: body.rideId },
      select: {
        id: true,
        status: true,
        distance: true,
        riderId: true,
        passengerId: true,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== RIDE_STATUS.COMPLETED) {
      throw new BadRequestException(
        'Feedback can only be submitted for completed rides',
      );
    }

    const isRider = ride.riderId === userId;
    const isPassenger = ride.passengerId === userId;

    if (!isRider && !isPassenger) {
      throw new BadRequestException('User is not part of this ride');
    }

    const effectiveRole = isRider ? USER_ROLE.RIDER : USER_ROLE.PASSENGER;

    const duplicate = await this.prisma.feedback.findFirst({
      where: {
        rideId: body.rideId,
        fromUserId: userId,
        toUserId: body.toUserId,
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new BadRequestException('Feedback already submitted for this ride');
    }

    const karma = KarmaCalculationService.calculateKarmaPoints({
      distance: ride.distance,
      feedbackRating: body.emoji,
    });

    // The feedback row and the balance change belong together: crediting
    // points without recording why would leave the two permanently at odds.
    const created = await this.prisma.$transaction(async (tx) => {
      const feedback = await tx.feedback.create({
        data: {
          rideId: body.rideId,
          fromUserId: userId,
          toUserId: body.toUserId,
          role: effectiveRole,
          emoji: body.emoji,
          comment: body.comment,
        },
      });

      const balance =
        effectiveRole === USER_ROLE.RIDER ? 'karmaPoints' : 'creditScore';

      await tx.user.update({
        where: { id: userId },
        data: { [balance]: { increment: karma.totalPoints } },
      });

      if (effectiveRole === USER_ROLE.RIDER) {
        await tx.karmaTransaction.create({
          data: {
            userId,
            points: karma.totalPoints,
            type: 'earned',
            reason: `Ride feedback: ${KarmaCalculationService.getFeedbackRatingDescription(
              body.emoji,
            )} | Distance: ${ride.distance ?? 'N/A'}km | Points: ${karma.totalPoints}`,
          },
        });
      }

      return feedback;
    });

    this.logger.log({
      level: 'info',
      message: `Feedback recorded and points awarded`,
      tag: 'feedback',
      rideId: body.rideId,
      fromUserId: userId,
      role: effectiveRole,
      algorithm: TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING,
      distance: ride.distance,
      points: karma.totalPoints,
    });

    const [allFeedback, updatedUser] = await Promise.all([
      this.prisma.feedback.findMany({
        where: { rideId: body.rideId },
        select: { role: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, karmaPoints: true, creditScore: true },
      }),
    ]);

    const roles = new Set(allFeedback.map((f) => f.role));

    return {
      // Mapped explicitly so the response cannot pick up new Feedback columns.
      feedback: {
        rideId: created.rideId,
        fromUserId: created.fromUserId,
        toUserId: created.toUserId,
        role: created.role as USER_ROLE,
        emoji: created.emoji as FEEDBACK_EMOJI,
        comment: created.comment,
      } as FeedbackDto,
      pointsAwarded: karma.totalPoints,
      karma,
      distance: ride.distance,
      user: updatedUser,
      feedbackComplete:
        roles.has(USER_ROLE.RIDER) && roles.has(USER_ROLE.PASSENGER),
    };
  }

  private assertWellFormed(body: Omit<FeedbackDto, 'fromUserId'>): void {
    if (
      !body.rideId ||
      !body.toUserId ||
      body.emoji === undefined ||
      body.emoji === null
    ) {
      throw new BadRequestException('Missing required feedback fields');
    }

    const valid = Object.values(FEEDBACK_EMOJI).filter(
      (v) => typeof v === 'number',
    );

    if (!valid.includes(body.emoji)) {
      throw new BadRequestException(
        `Invalid feedback rating. Must be one of: ${valid.join(', ')} (0=Satisfied, 1=Neutral, 2=Dissatisfied)`,
      );
    }
  }
}
