import { DISTANCE_TIER, FEEDBACK_EMOJI } from './enums';

import { DistanceThreshold, KarmaPointsConfig } from '../interfaces/types';

/**
 * Distance thresholds in kilometers for tier classification
 */
export const DISTANCE_THRESHOLDS: Record<DISTANCE_TIER, DistanceThreshold> = {
  [DISTANCE_TIER.SHORT]: { min: 0, max: 2, multiplier: 1.0 },
  [DISTANCE_TIER.MEDIUM]: { min: 2, max: 5, multiplier: 1.5 },
  [DISTANCE_TIER.LONG]: { min: 5, max: 10, multiplier: 2.0 },
  [DISTANCE_TIER.VERY_LONG]: { min: 10, max: Infinity, multiplier: 2.5 },
} as const;

/**
 * Karma calculation system configuration
 *
 * Uses the TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING algorithm:
 * P = min(max((B × D_m) + S_b, F_min), F_max)
 *
 */
export const KARMA_POINTS: KarmaPointsConfig = {
  BASE_POINTS: 15,
  SENTIMENT_BONUS: {
    [FEEDBACK_EMOJI.SATISFIED]: 5,
    [FEEDBACK_EMOJI.NEUTRAL]: 2,
    [FEEDBACK_EMOJI.DISSATISFIED]: 0,
  },
  MAX_POINTS_CAP: 100,
  MIN_POINTS_FLOOR: 5,
} as const;
