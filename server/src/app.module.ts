import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { KarmaController } from './karma.controller';
import { LogsController } from './logs.controller';
import { RideController } from './ride.controller';

import { AppService } from './app.service';
import { EnvService } from './env.service';
import { PrismaService } from './prisma.service';
import { KarmaRedemptionService } from './services/karma-redemption.service';

import { RideGateway } from './rides/rides.gateway';

import { winstonLoggerConfig } from './logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(winstonLoggerConfig),
  ],
  controllers: [
    AppController,
    AuthController,
    KarmaController,
    LogsController,
    RideController,
  ],
  providers: [
    AppService,
    EnvService,
    PrismaService,
    KarmaRedemptionService,
    RideGateway,
  ],
})
export class AppModule {}
