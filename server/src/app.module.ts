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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(winstonLoggerConfig),
  ],
  controllers: [AppController, AuthController, RideController],
  providers: [AppService, PrismaService, RideGateway],
})
export class AppModule {}
