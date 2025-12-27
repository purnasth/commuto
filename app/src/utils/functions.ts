import { RideFormData } from '../interfaces/types';
import type { UserDetails } from '../interfaces/types';

import { USER_ROLE } from '../constants/enums';
import { API_USER_KARMA_POINTS, API_USER_CREDIT_SCORE } from '../constants/api';

import { getUserData } from './auth';

/**
 * Truncates a location string to its first three comma-separated parts.
 *
 * @param location - The full location string to be truncated.
 * @returns The truncated location string containing up to the first three parts.
 */
export const truncateLocation = (location: string): string => {
  const parts = location.split(',');
  const truncated = parts.slice(0, 3).join(',');
  return truncated.trim();
};

/**
 * Highlights the matched query text within a string by wrapping it in a span.
 * @param text - The text to search within.
 * @param query - The query string to highlight.
 * @returns The text with matched query wrapped in a span.
 */
export const highlightMatch = (text: string, query: string) => {
  const regex = new RegExp(`(${query})`, 'gi'); // Create a regex to match the query
  return text.replace(
    regex,
    (match) =>
      `<span class="bg-teal-100 dark:bg-teal-600 font-medium">${match}</span>`,
  );
};

/**
 * Formats a timestamp into a full date string with time and date parts.
 * @param timestamp - The timestamp to format (string, number, or Date).
 * @returns The formatted date string.
 */
export const formatFullDate = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp);

  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short', // e.g., Sun
    month: 'short', // e.g., Apr
    day: '2-digit', // e.g., 13
    year: 'numeric', // e.g., 2025
  });

  return `${time} ${' '} ${datePart}`;
};

/**
 * Extracts and capitalizes the first name from an email address.
 * @param email - The email address.
 * @returns The capitalized first name.
 */
export const getFirstNameFromEmail = (email: string): string => {
  return (
    email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
  );
};

/**
 * Extracts the first name from a full name string
 * @param fullname - The user's full name
 *
 * @returns The first name, or the full name if no space is found
 */
export function getFirstNameFromFullName(fullname: string): string {
  if (!fullname) {
    return '';
  }

  const parts = fullname.trim().split(' ');

  return parts[0] || fullname;
}

/**
 * Gets the user's greeting (first name) from JWT auth storage if available.
 * @returns The user's first name or null if not found.
 */
export const getUserGreeting = (): string | null => {
  const userData = getUserData();

  if (userData?.fullname) {
    return userData.fullname.split(' ')[0];
  }

  return null;
};

/**
 * Gets the current year as a number.
 * @returns The current year.
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Truncates a string to a max length, adding ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format a date as 'h a EEE, MMM dd' (e.g., '11pm Sat, Jun 12')
 */
export function formatDayMonthWithWeekday(dateString: string): string {
  const date = new Date(dateString);
  // Get hour in 12-hour format, lowercase am/pm, and remove leading zero
  let hour = date.getHours();
  const ampm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  // Format: 11pm Sat, Jun 12
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  const day = date.toLocaleDateString(undefined, { day: 'numeric' });
  return `${hour}${ampm} ${weekday}, ${month} ${day}`;
}

/**
 * Safely retrieves the user object from JWT auth storage.
 * @returns {UserDetails | null}
 */
export function getStoredUser(): UserDetails | null {
  const userData = getUserData();

  if (!userData) {
    return null;
  }

  return {
    id: userData.id,
    fullname: userData.fullname,
    email: userData.email,
    role: userData.role as USER_ROLE,
  };
}

/**
 * Determines if the user has enough karma points to redeem a reward.
 * @param karmaPoints - The user's current karma points.
 * @param itemPoints - The required points for the reward.
 * @returns True if the user can redeem, false otherwise.
 */
export function canRedeemReward(
  karmaPoints: number,
  itemPoints: number,
): boolean {
  return Number(karmaPoints) >= Number(itemPoints);
}

/**
 * Calculates the progress ratio towards a reward.
 * @param karmaPoints - The user's current karma points.
 * @param itemPoints - The required points for the reward.
 * @returns A number between 0 and 1 representing progress.
 */
export function getRedeemProgress(
  karmaPoints: number,
  itemPoints: number,
): number {
  if (!itemPoints || itemPoints <= 0) return 0;
  return Math.max(0, Math.min(Number(karmaPoints) / Number(itemPoints), 1));
}

/**
 * Returns the appropriate progress bar color gradient for a reward.
 * @param progress - The progress ratio (0 to 1).
 * @param canRedeem - Whether the user can redeem the reward.
 * @returns Tailwind gradient class string.
 */
export function getRedeemProgressBarColor(
  progress: number,
  canRedeem: boolean,
): string {
  if (canRedeem) return 'from-green-600 to-green-400';
  if (progress > 0) return 'from-blue-600 to-blue-400';
  return 'from-gray-600 to-gray-400';
}

/**
 * Fetches the karma points for a specific user by their user ID.
 *
 * Makes an HTTP GET request to the API endpoint to retrieve the user's karma points.
 * Returns the number of karma points if available, otherwise returns 0.
 *
 * @param userId - The unique identifier of the user whose karma points are to be fetched.
 * @returns A promise that resolves to the user's karma points as a number.
 */
export async function fetchUserKarmaPoints(userId: number): Promise<number> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const url = `${baseUrl}${API_USER_KARMA_POINTS.replace(':userId', String(userId))}`;
  const res = await fetch(url);

  if (!res.ok) {
    return 0;
  }

  const data = await res.json();

  return typeof data.karmaPoints === 'number' ? data.karmaPoints : 0;
}

/**
 * Fetches the credit score for a specific user by their user ID.
 *
 * Makes an HTTP GET request to the API endpoint to retrieve the user's credit score.
 * Returns the number of credit score if available, otherwise returns 0.
 *
 * @param userId - The unique identifier of the user whose credit score is to be fetched.
 * @returns A promise that resolves to the user's credit score as a number.
 */
export async function fetchUserCreditScore(userId: number): Promise<number> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const url = `${baseUrl}${API_USER_CREDIT_SCORE.replace(':userId', String(userId))}`;
  const res = await fetch(url);

  if (!res.ok) {
    return 0;
  }

  const data = await res.json();

  return typeof data.creditScore === 'number' ? data.creditScore : 0;
}

/**
 * Formats a date in voucher style: "Aug 24, 2025"
 * @param date - The date to format (Date object, string, or number)
 * @returns The formatted date string
 */
export const formatVoucherDate = (date: string | number | Date): string => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Gets the current date as a Date object
 * @returns The current date
 */
export const getCurrentDate = (): Date => {
  return new Date();
};

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

/**
 * Capitalizes the first letter of a string and converts the rest to lowercase
 * @param str - The string to capitalize
 * @returns The capitalized string
 *
 * @example
 * capitalize('COMMUTO') // returns 'Commuto'
 */
export const capitalize = (str: string): string => {
  if (!str) return str;

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Generate feedback key for localStorage based on ride and user
 */
export function getFeedbackKey(
  ride: Pick<RideFormData, 'id'>,
  userId: number | null | undefined,
): string {
  return `feedback_${ride.id}_${userId ?? ''}`;
}
