import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvService {
  constructor(private configService: ConfigService) {}

  get isDev(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }
}
