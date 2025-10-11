import { FEEDBACK_EMOJI } from '../../src/constants/enums';
import { KarmaCalculationService } from '../../src/services/karma-calculation.service';

describe('KarmaCalculationService', () => {
  it('calculates karma points for short distance and satisfied feedback', () => {
    const result = KarmaCalculationService.calculateKarmaPoints({
      distance: 2,
      feedbackRating: FEEDBACK_EMOJI.SATISFIED,
    });
    expect(result.totalPoints).toBeGreaterThan(0);
    expect(result.distanceTier).toBeDefined();
    expect(result.sentimentBonus).toBeGreaterThanOrEqual(0);
  });

  it('applies sentiment bonus correctly', () => {
    const satisfied = KarmaCalculationService.calculateKarmaPoints({
      distance: 5,
      feedbackRating: FEEDBACK_EMOJI.SATISFIED,
    });
    const neutral = KarmaCalculationService.calculateKarmaPoints({
      distance: 5,
      feedbackRating: FEEDBACK_EMOJI.NEUTRAL,
    });
    expect(satisfied.totalPoints).toBeGreaterThan(neutral.totalPoints);
  });
});
