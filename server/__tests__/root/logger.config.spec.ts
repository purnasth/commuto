import { winstonLoggerConfig } from '../../src/logger.config';

describe('winstonLoggerConfig', () => {
  it('should export a config object with transports', () => {
    expect(winstonLoggerConfig).toHaveProperty('transports');
    expect(Array.isArray(winstonLoggerConfig.transports)).toBe(true);
  });
});
