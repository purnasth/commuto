import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { RideController } from './ride.controller';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerConfig } from './logger.config';
import { RideGateway } from './rides/rides.gateway';
import { EnvService } from './env.service';
import { LogsController } from './logs.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(winstonLoggerConfig),
  ],
  controllers: [AppController, AuthController, RideController, LogsController],
  providers: [AppService, PrismaService, RideGateway, EnvService],
})
export class AppModule {}
