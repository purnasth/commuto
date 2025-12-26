import type { StringValue } from 'ms';
import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { KarmaController } from './karma.controller';
import { LogsController } from './logs.controller';
import { RideController } from './ride.controller';

import { AppService } from './app.service';
import { EnvService } from './env.service';
import { PrismaService } from './prisma.service';
import { AuthService } from './services/auth.service';
import { KarmaRedemptionService } from './services/karma-redemption.service';

import { RideGateway } from './rides/rides.gateway';
import { JwtStrategy } from './auth/jwt.strategy';

import { winstonLoggerConfig } from './logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(winstonLoggerConfig),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET') || '',
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
    AppService,
    EnvService,
    PrismaService,
    AuthService,
    KarmaRedemptionService,
    RideGateway,
    JwtStrategy,
  ],
})
export class AppModule {}
