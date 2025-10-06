import {
  Get,
  Put,
  Post,
  Body,
  Param,
  Inject,
  Controller,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

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
  async redeemReward(@Body(ValidationPipe) data: RedeemRewardDto) {
    this.logger.log({
      level: 'info',
      message: 'Karma redemption attempt',
      tag: 'karma',
      userId: data.userId,
      rewardId: data.rewardId,
    });

    return await this.karmaService.redeemReward(data);
  }

  /**
   * Get user's redemption history
   * GET /karma/user/:userId
   */
  @Get('user/:userId')
  async getUserRedemptions(@Param('userId', ParseIntPipe) userId: number) {
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
