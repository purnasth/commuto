import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service';

import {
  RedeemRewardDto,
  UpdateRedemptionStatusDto,
} from '../dto/karma-redemption.dto';

import { REDEMPTION_STATUS } from '../constants/enums';

import { addMonthsToDate, generateVoucherId } from '../utils/voucher.utils';

@Injectable()
export class KarmaRedemptionService {
  constructor(private prisma: PrismaService) {}

  // TODO:
  /**
   * @function getAvailableRewards
   * @description
   * This endpoint fetches the available rewards to redeem.
   *
   * - Implement this endpoint once rewards need to be managed dynamically from the admin panel/database.
   * - Currently, rewards are statically managed in the frontend `data.ts` for simplicity.
   */

  async redeemReward(userId: number, data: RedeemRewardDto) {
    return await this.prisma.$transaction(async (prisma) => {
      // Validate user exists and has sufficient karma points
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, karmaPoints: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Deduct first, with the balance requirement expressed in the WHERE
      // clause so the check and the decrement are a single atomic statement.
      // Reading the balance and then decrementing lets two concurrent
      // redemptions both pass the check and spend the same points twice.
      const deducted = await prisma.user.updateMany({
        where: { id: userId, karmaPoints: { gte: data.karmaPointsCost } },
        data: { karmaPoints: { decrement: data.karmaPointsCost } },
      });

      if (deducted.count === 0) {
        throw new BadRequestException(
          `Insufficient karma points. Required: ${data.karmaPointsCost}, Available: ${user.karmaPoints}`,
        );
      }

      const redemptionCode = generateVoucherId(data.rewardName, userId);

      const expiresAt = addMonthsToDate(new Date(), 1);

      const redemption = await prisma.karmaTransaction.create({
        data: {
          userId: userId,
          points: -data.karmaPointsCost,
          type: 'redeemed',
          reason: `Redeemed: ${data.rewardName}`,
          rewardName: data.rewardName,
          redemptionCode,
          status: REDEMPTION_STATUS.ACTIVE,
          expiresAt,
          // usedAt is null initially, set when status becomes USED
        },
      });

      return {
        message: 'Reward redeemed successfully',
        redemption: {
          id: redemption.id,
          rewardId: data.rewardId,
          rewardName: data.rewardName,
          karmaPointsCost: data.karmaPointsCost,
          redemptionCode,
          status: REDEMPTION_STATUS.ACTIVE,
          expiresAt,
          redeemedAt: redemption.createdAt, // This is the redeemAt timestamp
        },
        remainingKarmaPoints: user.karmaPoints - data.karmaPointsCost,
        success: true,
      };
    });
  }

  async getUserRedemptions(userId: number) {
    const redemptions = await this.prisma.karmaTransaction.findMany({
      where: { userId, type: 'redeemed' },
      select: {
        id: true,
        rewardName: true,
        points: true,
        redemptionCode: true,
        status: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true, // This is redeemedAt
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      redemptions: redemptions.map((r) => ({
        id: r.id,
        rewardName: r.rewardName,
        karmaPointsCost: Math.abs(r.points),
        redemptionCode: r.redemptionCode,
        status: r.status,
        expiresAt: r.expiresAt,
        usedAt: r.usedAt,
        redeemedAt: r.createdAt, // When it was redeemed
      })),
      total: redemptions.length,
    };
  }

  async updateRedemptionStatus(
    code: string,
    data: UpdateRedemptionStatusDto,
    userId: number,
  ) {
    // Scope the lookup to the caller so a wrong code and someone else's code
    // are indistinguishable, leaving no way to probe for valid codes.
    const redemption = await this.prisma.karmaTransaction.findFirst({
      where: { redemptionCode: code, type: 'redeemed', userId },
    });

    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    const updateData: { status: REDEMPTION_STATUS; usedAt?: Date } = {
      status: data.status,
    };

    // Auto-set usedAt when marking as USED
    if (
      data.status === REDEMPTION_STATUS.USED &&
      redemption.status !== REDEMPTION_STATUS.USED
    ) {
      updateData.usedAt = new Date(); // Auto-filled timestamp
    }

    await this.prisma.karmaTransaction.update({
      where: { id: redemption.id },
      data: updateData,
    });

    return {
      message: 'Status updated successfully',
      status: data.status,
      updatedAt: new Date(),
    };
  }
}
