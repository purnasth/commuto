/**
 * Algorithm Overview:
 *
 * TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING is a mathematical approach to fair
 * resource allocation that combines distance-based tiered scaling with quality-based
 * weighting factors. The algorithm ensures proportional reward distribution while
 * maintaining system stability through bounded outputs.
 *
 * Mathematical Definition:
 * P = min(max((B × D_m) + S_b, F_min), F_max)
 *
 * Where:
 * - P = Final points awarded
 * - B = Base points (participation reward), default is 15
 * - D_m = Distance multiplier (tier-based scaling factor)
 * - S_b = Sentiment bonus (quality weighting)
 * - F_min = Minimum floor (system stability), default is 5
 * - F_max = Maximum cap (exploitation prevention)
 *
 */

export const TIERED_LINEAR_SCALING_WITH_SENTIMENT_WEIGHTING =
  'Tiered Linear Scaling with Sentiment Weighting';
