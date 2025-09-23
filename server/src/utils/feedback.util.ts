import { FEEDBACK_EMOJI } from '../constants/enums';

import { AverageScoreResult, EmojiBreakdown } from '../interfaces/types';

/**
 * Type guard to check if a value is a valid FEEDBACK_EMOJI
 * @param value - The value to check
 * @returns True if the value is a valid FEEDBACK_EMOJI
 */
const isValidFeedbackEmoji = (value: number): value is FEEDBACK_EMOJI => {
  return Object.values(FEEDBACK_EMOJI).includes(value as FEEDBACK_EMOJI);
};

/**
 * Creates an empty emoji breakdown with all values set to 0
 * @returns Empty emoji breakdown object
 */
export const createEmptyEmojiBreakdown = (): EmojiBreakdown => ({
  [FEEDBACK_EMOJI.SATISFIED]: 0,
  [FEEDBACK_EMOJI.NEUTRAL]: 0,
  [FEEDBACK_EMOJI.DISSATISFIED]: 0,
});

/**
 * Creates the default response for users with no feedback
 * @returns Default average score result
 */
export const createDefaultAverageScoreResult = (): AverageScoreResult => ({
  averageScore: null,
  totalFeedback: 0,
  emojiBreakdown: createEmptyEmojiBreakdown(),
});

/**
 * Calculates emoji breakdown from feedback array
 * @param feedbackList Array of feedback objects with emoji property
 * @returns Emoji breakdown object
 */
export const calculateEmojiBreakdown = (
  feedbackList: Array<{ emoji: number }>,
): EmojiBreakdown => {
  const breakdown = createEmptyEmojiBreakdown();

  feedbackList.forEach((feedback) => {
    if (isValidFeedbackEmoji(feedback.emoji)) {
      breakdown[feedback.emoji]++;
    } else {
      console.warn(
        `Invalid feedback emoji value: ${feedback.emoji}. Skipping.`,
      );
    }
  });

  return breakdown;
};

/**
 * Calculates average score from feedback array
 * @param feedbackList Array of feedback objects with emoji property
 * @returns Average score rounded to 2 decimal places
 */
export const calculateAverageScore = (
  feedbackList: Array<{ emoji: number }>,
): number => {
  if (feedbackList.length === 0) {
    return 0;
  }

  const totalScore = feedbackList.reduce(
    (sum, feedback) => sum + feedback.emoji,
    0,
  );

  const averageScore = totalScore / feedbackList.length;
  return Math.round(averageScore * 100) / 100; // Round to 2 decimal places
};

/**
 * Processes feedback data and returns complete average score result
 * @param feedbackList Array of feedback objects with emoji property
 * @returns Complete average score result
 */
export const processFeedbackData = (
  feedbackList: Array<{ emoji: number }>,
): AverageScoreResult => {
  if (feedbackList.length === 0) {
    return createDefaultAverageScoreResult();
  }

  const emojiBreakdown = calculateEmojiBreakdown(feedbackList);
  const averageScore = calculateAverageScore(feedbackList);

  return {
    averageScore,
    totalFeedback: feedbackList.length,
    emojiBreakdown,
  };
};
