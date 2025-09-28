import { DISTANCE_TIER, FEEDBACK_EMOJI } from '../constants/enums';
import { DISTANCE_THRESHOLDS, KARMA_POINTS } from '../constants/karma-config';

import {
  DistanceThreshold,
  KarmaPointsConfig,
  KarmaCalculationInput,
  KarmaCalculationResult,
} from '../interfaces/types';

/**
 * Centralized Karma Calculation Service
 *
 * Implements the TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING algorithm
 * for calculating karma points based on ride distance and user feedback.
 *
 * Algorithm Overview:
 * TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING is a mathematical approach to fair
 * resource allocation that combines distance-based tiered scaling with quality-based
 * weighting factors. The algorithm ensures proportional reward distribution while
 * maintaining system stability through bounded outputs.
 *
 * Mathematical Definition:
 * P = min(max((B × D_m) + S_b, F_min), F_max)
 * Where:
 * - P = Final points awarded
 * - B = Base points (participation reward)
 * - D_m = Distance multiplier (tier-based scaling factor)
 * - S_b = Sentiment bonus (quality weighting)
 * - F_min = Minimum floor (system stability)
 * - F_max = Maximum cap (exploitation prevention)
 *
 * Algorithm Specifications:
 * 1. Tiered Distance Scaling: Linear scaling factors based on distance ranges
 * 2. Sentiment Weighting: Quality-based bonus application
 * 3. Bounded Output: Min/max constraints for system integrity
 * 4. Proportional Fairness: Reward proportional to contribution
 */
export class KarmaCalculationService {
  /**
   * Determines the distance tier based on ride distance
   *
   * @param distance - The ride distance in kilometers
   * @returns The appropriate distance tier
   */
  private static getDistanceTier(distance: number): DISTANCE_TIER {
    const thresholds = DISTANCE_THRESHOLDS;

    if (distance >= thresholds[DISTANCE_TIER.VERY_LONG].min) {
      return DISTANCE_TIER.VERY_LONG;
    }
    if (distance >= thresholds[DISTANCE_TIER.LONG].min) {
      return DISTANCE_TIER.LONG;
    }
    if (distance >= thresholds[DISTANCE_TIER.MEDIUM].min) {
      return DISTANCE_TIER.MEDIUM;
    }

    return DISTANCE_TIER.SHORT;
  }

  /**
   * Gets the distance multiplier for a given distance
   *
   * @param distance - The ride distance in kilometers
   * @returns The multiplier value for the distance tier
   */
  private static getDistanceMultiplier(distance: number): number {
    const tier: DISTANCE_TIER =
      KarmaCalculationService.getDistanceTier(distance);
    const thresholds = DISTANCE_THRESHOLDS;

    return thresholds[tier].multiplier;
  }

  /**
   * Calculates karma points using the TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING algorithm
   */
  static calculateKarmaPoints(
    input: KarmaCalculationInput,
  ): KarmaCalculationResult {
    const { distance, feedbackRating } = input;
    const config: KarmaPointsConfig = KARMA_POINTS;

    // Step 1: Base points (minimum reward for participation)
    const basePoints: number = config.BASE_POINTS;

    // Step 2: Distance-based calculation
    let distanceMultiplier = 1.0;
    let distanceTier: DISTANCE_TIER = DISTANCE_TIER.SHORT;

    if (distance !== null && distance > 0) {
      distanceTier = KarmaCalculationService.getDistanceTier(distance);
      distanceMultiplier =
        KarmaCalculationService.getDistanceMultiplier(distance);
    }

    const pointsAfterDistance: number = basePoints * distanceMultiplier;

    // Step 3: Sentiment bonus application
    const sentimentBonus: number = config.SENTIMENT_BONUS[feedbackRating] ?? 0;
    const pointsAfterSentiment: number = pointsAfterDistance + sentimentBonus;

    // Step 4: Apply caps and floors
    const finalPoints: number = Math.min(
      Math.max(pointsAfterSentiment, config.MIN_POINTS_FLOOR),
      config.MAX_POINTS_CAP,
    );

    // Create formula string for transparency
    const formula = `Points = min(max((${basePoints} × ${Math.round(distanceMultiplier)}) + ${Math.round(sentimentBonus)}, ${config.MIN_POINTS_FLOOR}), ${config.MAX_POINTS_CAP}) = ${Math.round(finalPoints)}`;

    return {
      totalPoints: Math.round(finalPoints),
      basePoints,
      distanceMultiplier,
      distanceTier,
      sentimentBonus,
      formula,
      breakdown: {
        step1_base: basePoints,
        step2_afterDistance: Math.round(pointsAfterDistance),
        step3_afterSentiment: Math.round(pointsAfterSentiment),
        step4_final: Math.round(finalPoints),
      },
    };
  }

  /**
   * Get a human-readable description of the distance tier
   *
   * @param tier - The distance tier
   * @returns Human-readable description
   */
  static getDistanceTierDescription(tier: DISTANCE_TIER): string {
    const thresholds = DISTANCE_THRESHOLDS;
    const threshold: DistanceThreshold = thresholds[tier];

    if (tier === DISTANCE_TIER.VERY_LONG) {
      return `${threshold.min}+ km (${threshold.multiplier}x multiplier)`;
    }
    return `${threshold.min}-${threshold.max} km (${threshold.multiplier}x multiplier)`;
  }

  /**
   * Get rating description for logging (backend calculation context)
   *
   * @param rating - The feedback rating value
   * @returns Human-readable rating description for logs
   */
  static getFeedbackRatingDescription(rating: FEEDBACK_EMOJI): string {
    const descriptions: Record<FEEDBACK_EMOJI, string> = {
      [FEEDBACK_EMOJI.SATISFIED]: 'Satisfied',
      [FEEDBACK_EMOJI.NEUTRAL]: 'Neutral',
      [FEEDBACK_EMOJI.DISSATISFIED]: 'Dissatisfied',
    };
    return descriptions[rating] ?? `Unknown rating (${rating})`;
  }
}
