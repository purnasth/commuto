import { getTimeWindow } from '../../src/utils/timeWindow.util';

describe('getTimeWindow', () => {
  it('should return correct min and max window', () => {
    const center = new Date('2025-10-11T12:00:00Z');
    const { min, max } = getTimeWindow(center, 10);
    expect(min.getTime()).toBe(center.getTime() - 10 * 60000);
    expect(max.getTime()).toBe(center.getTime() + 10 * 60000);
  });
});
