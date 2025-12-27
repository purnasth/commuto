import { IsNotEmpty, IsString, IsEnum, IsInt, Min } from 'class-validator';

import { REDEMPTION_STATUS } from '../constants/enums';

// DTO for redeeming a reward
export class RedeemRewardDto {
  @IsString()
  @IsNotEmpty()
  rewardId: string;

  @IsString()
  @IsNotEmpty()
  rewardName: string;

  @IsInt()
  @Min(1)
  karmaPointsCost: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}

// DTO for updating redemption status
export class UpdateRedemptionStatusDto {
  @IsEnum(REDEMPTION_STATUS)
  status: REDEMPTION_STATUS;
}
