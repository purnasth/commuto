import {
  calculateEmojiBreakdown,
  createEmptyEmojiBreakdown,
  createDefaultAverageScoreResult,
} from '../../src/utils/feedback.util';

describe('feedback.util', () => {
  it('should create empty emoji breakdown', () => {
    const breakdown = createEmptyEmojiBreakdown();
    expect(breakdown).toEqual({ 0: 0, 1: 0, 2: 0 });
  });
  it('should create default average score result', () => {
    const result = createDefaultAverageScoreResult();
    expect(result.averageScore).toBeNull();
    expect(result.totalFeedback).toBe(0);
    expect(result.emojiBreakdown).toEqual({ 0: 0, 1: 0, 2: 0 });
  });
  it('should calculate emoji breakdown correctly', () => {
    const feedbackList = [
      { emoji: 0 },
      { emoji: 1 },
      { emoji: 0 },
      { emoji: 2 },
    ];
    const breakdown = calculateEmojiBreakdown(feedbackList);
    expect(breakdown).toEqual({ 0: 2, 1: 1, 2: 1 });
  });
});
