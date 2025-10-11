import { ConfigService } from '@nestjs/config';
import { EnvService } from '../../src/env.service';

describe('EnvService', () => {
  it('should return true if NODE_ENV is development', () => {
    const configService = {
      get: jest.fn().mockReturnValue('development'),
    } as unknown as ConfigService;
    const envService = new EnvService(configService);
    expect(envService.isDev).toBe(true);
  });

  it('should return false if NODE_ENV is not development', () => {
    const configService = {
      get: jest.fn().mockReturnValue('production'),
    } as unknown as ConfigService;
    const envService = new EnvService(configService);
    expect(envService.isDev).toBe(false);
  });
});
