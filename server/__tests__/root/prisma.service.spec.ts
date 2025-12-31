import { LoggerService } from '@nestjs/common';
import { PrismaService } from '../../src/prisma.service';

describe('PrismaService', () => {
  it('should instantiate and connect without error', async () => {
    const mockLogger: LoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };
    const service = new PrismaService(mockLogger);
    await expect(service.onModuleInit()).resolves.not.toThrow();
  });
});
