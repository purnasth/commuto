import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { KarmaController } from '../../src/karma.controller';
import { REDEMPTION_STATUS } from '../../src/constants/enums';
import { KarmaRedemptionService } from '../../src/services/karma-redemption.service';

describe('KarmaController', () => {
  let controller: KarmaController;
  let service: KarmaRedemptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KarmaController],
      providers: [
        {
          provide: KarmaRedemptionService,
          useValue: {
            redeemReward: jest.fn(),
            getUserRedemptions: jest.fn(),
            updateRedemptionStatus: jest.fn(),
          },
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();
    controller = module.get<KarmaController>(KarmaController);
    service = module.get<KarmaRedemptionService>(KarmaRedemptionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call redeemReward on service', async () => {
    const dto = {
      userId: 1,
      rewardId: 'r1',
      rewardName: 'Test',
      karmaPointsCost: 10,
      description: 'desc',
    };
    const mockResult = {
      message: 'Reward redeemed successfully',
      redemption: {
        id: 1,
        rewardId: 'r1',
        rewardName: 'Test',
        karmaPointsCost: 10,
        redemptionCode: 'TEST-123',
        status: REDEMPTION_STATUS.ACTIVE,
        expiresAt: new Date(),
        redeemedAt: new Date(),
      },
      remainingKarmaPoints: 90,
      success: true,
    };
    const redeemSpy = jest
      .spyOn(service, 'redeemReward')
      .mockResolvedValue(mockResult);
    const result = await controller.redeemReward(dto);
    expect(redeemSpy).toHaveBeenCalledWith(dto);
    expect(result).toBe(mockResult);
  });
});
