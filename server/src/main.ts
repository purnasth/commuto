import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER));
  app.enableCors();
  const port = process.env.PORT ?? 3000;
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  await app.listen(port);
  logger.log(`🚀 Backend server started at http://localhost:${port}`);
}
void bootstrap();
