/**
 * Utility for calculating min/max time window for ride matching.
 *
 * @param center ISO string or Date for the center time
 * @param windowMinutes Number of minutes for the window (default: 5)
 * @returns { min: Date, max: Date }
 */
export function getTimeWindow(
  center: string | Date,
  windowMinutes: number,
): { min: Date; max: Date } {
  const centerDate = typeof center === 'string' ? new Date(center) : center;

  const min = new Date(centerDate.getTime() - windowMinutes * 60000);
  const max = new Date(centerDate.getTime() + windowMinutes * 60000);

  return { min, max };
}
