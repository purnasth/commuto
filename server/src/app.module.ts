import type { StringValue } from 'ms';
import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { KarmaController } from './karma.controller';
import { LogsController } from './logs.controller';
import { RideController } from './ride.controller';

import { APP_GUARD } from '@nestjs/core';

import { AppService } from './app.service';
import { EnvService, requireSecret } from './env.service';
import { PrismaService } from './prisma.service';
import { AuthService } from './services/auth.service';
import { KarmaRedemptionService } from './services/karma-redemption.service';
import { RideExpiryService } from './services/ride-expiry.service';
import { RideStatsService } from './services/ride-stats.service';
import { RideHistoryService } from './services/ride-history.service';
import { RideLifecycleService } from './services/ride-lifecycle.service';
import { RideMatchingService } from './services/ride-matching.service';

import { RideGateway } from './rides/rides.gateway';
import { JwtStrategy } from './auth/jwt.strategy';

import { winstonLoggerConfig } from './logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Baseline ceiling for every route. Credential endpoints tighten this
    // further with their own @Throttle decorators.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    WinstonModule.forRoot(winstonLoggerConfig),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: requireSecret(configService, 'JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
            '1h') as StringValue,
        },
      }),
      global: true,
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    KarmaController,
    LogsController,
    RideController,
  ],
  providers: [
    // Applied globally so a new endpoint is rate limited by default rather
    // than by remembering to decorate it.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    AppService,
    EnvService,
    PrismaService,
    AuthService,
    KarmaRedemptionService,
    RideExpiryService,
    RideStatsService,
    RideHistoryService,
    RideLifecycleService,
    RideMatchingService,
    RideGateway,
    JwtStrategy,
  ],
})
export class AppModule {}
