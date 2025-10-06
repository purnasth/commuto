/**
 * Adds a specified number of months to a given date.
 * Handles month overflow (e.g., adding to December rolls over to the next year).
 *
 * @param date - The date to which the months will be added (Date object, string, or number).
 * @param monthsToAdd - The number of months to add (can be negative to subtract months).
 * @returns The new date after adding the specified number of months.
 */
export const addMonthsToDate = (
  date: string | number | Date,
  monthsToAdd: number,
): Date => {
  const dateObj = new Date(date);
  dateObj.setMonth(dateObj.getMonth() + monthsToAdd);
  return dateObj;
};

/**
 * Generates a unique voucher ID
 * @param rewardName - The name of the reward
 * @param userId - The ID of the user redeeming the reward
 * @returns A unique voucher ID
 */
export const generateVoucherId = (
  rewardName: string,
  userId: number | string,
): string => {
  const timestamp = Date.now().toString().slice(-4);
  const abbreviation = rewardName
    .split(' ')
    .map((word) => word.charAt(0).toLowerCase())
    .join('');

  return `KARMA-${timestamp}-U${userId}-${abbreviation}`;
};

/**
 * Generates an abbreviation from a reward name
 * @param rewardName - The name of the reward (e.g., "Coffee Shop Coupon")
 * @returns The abbreviation (e.g., "CSC")
 */
export const generateRewardAbbreviation = (rewardName: string): string => {
  return rewardName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};
