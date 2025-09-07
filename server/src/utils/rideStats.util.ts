/**
 * Utility functions for ride statistics and carbon emission calculations.
 *
 * Includes Haversine distance calculation and carbon emission estimation using DEFRA factors.
 *
 * @see https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024
 */

/**
 * The radius of the Earth in kilometers (mean radius)
 */
export const EARTH_RADIUS_KM = 6371;

/**
 * Conversion factor from degrees to radians
 */
export const DEG_TO_RAD = Math.PI / 180;

/**
 * Maximum allowed proximity for ride matching (in km)
 */
export const MAX_RIDE_PROXIMITY_KM = 3;

/**
 * DEFRA 2024 average car emission factor (kg CO2 per km)
 */

/**
 * Speed constants for transport (km/h)
 *
 * https://smarter-usa.org/wp-content/uploads/2019/01/1-Motorcycle-Speeds-at-Urban-Intersections.pdf
 */
export enum TransportSpeed {
  BIKE = 38.28,
}

/**
 * Emission factors for different modes of transport (kg CO2 per km)
 */
export enum EmissionFactor {
  BIKE = 0.016,
  CAR = 0.17144,
}

/**
 * Calculates the great-circle distance between two points on Earth using the Haversine formula.
 * @param lat1 Latitude of the first point (degrees)
 * @param lon1 Longitude of the first point (degrees)
 * @param lat2 Latitude of the second point (degrees)
 * @param lon2 Longitude of the second point (degrees)
 *
 * @returns Distance in kilometers between the two points
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 *
 * Tier 1 Emission Factor Method
 * Emissions = Activity Data × Emission Factor
 *
 * Estimates CO₂ emissions for a given distance and vehicle type using DEFRA 2024 factors.
 *
 * @param distanceKm - Distance in kilometers
 * @param vehicle - Vehicle type (EmissionFactor)
 * @returns Estimated CO₂ emissions in kilograms
 *
 */
export function estimateCO2FromDistance(
  distanceKm: number,
  vehicle: EmissionFactor = EmissionFactor.BIKE, // Default to bike
): number {
  return distanceKm * vehicle;
}

/**
 * Calculates the estimated time of arrival (ETA) based on distance and transport mode.
 *
 * @param distanceKm - Distance to travel in kilometers
 * @param role - User role (rider or passenger) to determine transport mode
 * @returns Estimated time of arrival in minutes, rounded to nearest minute
 *
 * @example
 * const eta = calculateETA(5, USER_ROLE.RIDER); // Returns ETA for a 5km bike ride
 */
export function calculateETA(distanceKm: number): number {
  // Always use bike speed since rider will be on bike
  const speed = TransportSpeed.BIKE;

  // Convert distance and speed to consistent units (km and hours)
  const timeInHours = distanceKm / speed;

  // Convert to minutes and round to nearest minute
  return Math.round(timeInHours * 60);
}
