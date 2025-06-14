import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Get()
  getHello(): string {
    this.logger.log('GET / called, returning hello message');
    return this.appService.getHello();
  }
}
