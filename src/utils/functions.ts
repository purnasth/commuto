// export const truncateLocation = (
//   location: string,
//   maxLength: number = 50,
// ): string => {
//   if (location.length > maxLength) {
//     return `${location.substring(0, maxLength)}...`;
//   }
//   return location;
// };

// Function to truncate location string
export const truncateLocation = (location: string): string => {
  const parts = location.split(',');
  const truncated = parts.slice(0, 3).join(',');
  return truncated.trim();
};

// Function to highlight the matched text
export const highlightMatch = (text: string, query: string) => {
  const regex = new RegExp(`(${query})`, 'gi'); // Create a regex to match the query
  return text.replace(
    regex,
    (match) =>
      `<span class="bg-teal-100 dark:bg-teal-600 font-medium">${match}</span>`,
  );
};

// Function to format date to full date string
// export const formatFullDate = (timestamp: string | number | Date): string => {
//   const date = new Date(timestamp);
//   return date.toLocaleString('en-US', {
//     weekday: 'short', // e.g., Sat
//     month: 'short', // e.g., Apr
//     day: '2-digit', // e.g., 12
//     year: 'numeric', // e.g., 2025
//     hour: '2-digit', // e.g., 11
//     minute: '2-digit', // e.g., 25
//     hour12: true, // e.g., PM
//   });
// };
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

// Function to get the first name from email
export const getFirstNameFromEmail = (email: string): string => {
  return (
    email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
  );
};

// Function to get the user's greeting from local storage
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
