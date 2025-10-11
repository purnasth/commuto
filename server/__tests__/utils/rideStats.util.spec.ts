import {
  EARTH_RADIUS_KM,
  haversineDistance,
} from '../../src/utils/rideStats.util';

describe('rideStats.util', () => {
  it('should calculate haversine distance correctly', () => {
    const d = haversineDistance(0, 0, 0, 1);
    expect(d).toBeGreaterThan(0);
  });
  it('should use correct earth radius', () => {
    expect(EARTH_RADIUS_KM).toBe(6371);
  });
});
