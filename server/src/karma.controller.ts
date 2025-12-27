import {
  Get,
  Put,
  Post,
  Body,
  Param,
  Inject,
  Request,
  Controller,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  ForbiddenException,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthenticatedRequest } from './interfaces/types';

import {
  RedeemRewardDto,
  UpdateRedemptionStatusDto,
} from './dto/karma-redemption.dto';

import { KarmaRedemptionService } from './services/karma-redemption.service';

@Controller('karma')
export class KarmaController {
  constructor(
    private readonly karmaService: KarmaRedemptionService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  // TODO: Implement GET /karma/rewards endpoint when this is handled by the service
  /**
   * Get available rewards to redeem
   * GET /karma/rewards
   */
  // @Get('rewards')
  // async getAvailableRewards() {
  //   return await this.karmaService.getAvailableRewards();
  // }

  /**
   * Redeem a reward for karma points
   * POST /karma/redeem
   */
  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  async redeemReward(
    @Body(ValidationPipe) data: Omit<RedeemRewardDto, 'userId'>,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    this.logger.log({
      level: 'info',
      message: 'Karma redemption attempt',
      tag: 'karma',
      userId: authenticatedUserId,
      rewardId: data.rewardId,
    });

    return await this.karmaService.redeemReward(authenticatedUserId, data);
  }

  /**
   * Get user's redemption history
   * GET /karma/user/:userId
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserRedemptions(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    if (userId !== authenticatedUserId) {
      throw new ForbiddenException(
        'You can only view your own redemption history',
      );
    }

    return await this.karmaService.getUserRedemptions(userId);
  }

  /**
   * Update redemption status by code
   * PUT /karma/:code/status
   */
  @Put(':code/status')
  async updateRedemptionStatus(
    @Param('code') code: string,
    @Body(ValidationPipe) data: UpdateRedemptionStatusDto,
  ) {
    return await this.karmaService.updateRedemptionStatus(code, data);
  }
}
