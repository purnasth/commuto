import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully', PrismaService.name);
    } catch (error) {
      this.logger.error(
        '❌ Database connection failed',
        (error as Error).stack,
        PrismaService.name,
      );
      process.exit(1);
    }
  }
}
