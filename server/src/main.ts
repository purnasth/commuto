import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { resolveCorsOrigins } from './env.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER));

  // Without this, the class-validator decorators on the request DTOs never
  // run. `whitelist` strips properties the DTO does not declare, so a request
  // body cannot reach Prisma with extra columns attached (mass assignment).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Previously enableCors() with no arguments, which reflects every origin.
  app.enableCors({
    origin: resolveCorsOrigins(app.get(ConfigService)),
    credentials: true,
  });
  const port = process.env.PORT ?? 3000;
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  await app.listen(port);
  logger.log(`🚀 Backend server started at http://localhost:${port}`);
}
void bootstrap();
