import { LoggerService } from '@nestjs/common';
import { AppService } from '../../src/app.service';

describe('AppService', () => {
  it('should return welcome message', () => {
    const mockLogger: LoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };
    const service = new AppService(mockLogger);
    expect(service.getHello()).toBe('Welcome to Commuto!');
  });
});
