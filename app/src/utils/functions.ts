// export const truncateLocation = (
//   location: string,
//   maxLength: number = 50,
// ): string => {
//   if (location.length > maxLength) {
//     return `${location.substring(0, maxLength)}...`;
//   }
//   return location;
// };

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
 * Gets the user's greeting (first name) from local storage if available.
 * @returns The user's first name or null if not found.
 */
export const getUserGreeting = (): string | null => {
  const user = localStorage.getItem('user');
  if (user) {
    const parsedUser = JSON.parse(user);
    return getFirstNameFromEmail(parsedUser.email);
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
