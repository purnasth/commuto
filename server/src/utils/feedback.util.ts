import { FEEDBACK_EMOJI } from '../constants/enums';

import { AverageScoreResult, EmojiBreakdown } from '../interfaces/types';

// Type for logger interface to avoid tight coupling
type Logger = {
  warn: (message: string | object) => void;
};

/**
 * Type guard to check if a value is a valid FEEDBACK_EMOJI
 * Optimized for performance - uses range check instead of Object.values().includes()
 * Valid range: 0 (SATISFIED), 1 (NEUTRAL), 2 (DISSATISFIED)
 * @param value - The value to check
 * @returns True if the value is a valid FEEDBACK_EMOJI
 */
const isValidFeedbackEmoji = (value: number): value is FEEDBACK_EMOJI => {
  return value >= 0 && value <= 2 && Number.isInteger(value);
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
 * @param logger Optional logger instance for warnings
 * @returns Emoji breakdown object
 */
export const calculateEmojiBreakdown = (
  feedbackList: Array<{ emoji: number }>,
  logger?: Logger,
): EmojiBreakdown => {
  const breakdown = createEmptyEmojiBreakdown();

  feedbackList.forEach((feedback) => {
    if (isValidFeedbackEmoji(feedback.emoji)) {
      breakdown[feedback.emoji]++;
    } else {
      const warningMessage = `Invalid feedback emoji value: ${feedback.emoji}. Skipping.`;
      if (logger) {
        logger.warn({
          level: 'warn',
          message: warningMessage,
          tag: 'feedback',
          invalidEmoji: feedback.emoji,
        });
      } else {
        console.warn(warningMessage);
      }
    }
  });

  return breakdown;
};

/**
 * Calculates average score from feedback array
 * @param feedbackList Array of feedback objects with emoji property
 * @param logger Optional logger instance for warnings
 * @returns Average score rounded to 2 decimal places
 */
export const calculateAverageScore = (
  feedbackList: Array<{ emoji: number }>,
  logger?: Logger,
): number => {
  if (feedbackList.length === 0) {
    return 0;
  }

  // Filter out invalid emoji values before calculation
  const validFeedback = feedbackList.filter((feedback) => {
    if (isValidFeedbackEmoji(feedback.emoji)) {
      return true;
    } else {
      const warningMessage = `Invalid feedback emoji value: ${feedback.emoji}. Excluding from average calculation.`;
      if (logger) {
        logger.warn({
          level: 'warn',
          message: warningMessage,
          tag: 'feedback',
          invalidEmoji: feedback.emoji,
        });
      } else {
        console.warn(warningMessage);
      }
      return false;
    }
  });

  // If no valid feedback remains after filtering, return 0
  if (validFeedback.length === 0) {
    return 0;
  }

  const totalScore = validFeedback.reduce(
    (sum, feedback) => sum + feedback.emoji,
    0,
  );

  const averageScore = totalScore / validFeedback.length;
  return Math.round(averageScore * 100) / 100; // Round to 2 decimal places
};

/**
 * Processes feedback data and returns complete average score result
 * @param feedbackList Array of feedback objects with emoji property
 * @param logger Optional logger instance for warnings
 * @returns Complete average score result
 */
export const processFeedbackData = (
  feedbackList: Array<{ emoji: number }>,
  logger?: Logger,
): AverageScoreResult => {
  if (feedbackList.length === 0) {
    return createDefaultAverageScoreResult();
  }

  const emojiBreakdown = calculateEmojiBreakdown(feedbackList, logger);
  const averageScore = calculateAverageScore(feedbackList, logger);

  return {
    averageScore,
    totalFeedback: feedbackList.length,
    emojiBreakdown,
  };
};
