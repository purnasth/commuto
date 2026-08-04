import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Reads a secret the application cannot safely run without.
 *
 * Falling back to an empty string would leave tokens signed with a secret
 * anyone can guess, so a missing or still-placeholder value fails the boot
 * instead of silently producing forgeable tokens.
 */
export function requireSecret(
  configService: ConfigService,
  key: string,
): string {
  const value = configService.get<string>(key);

  if (!value || value.startsWith('CHANGE_ME')) {
    throw new Error(
      `${key} is missing or still set to the placeholder from .example.env. ` +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
    );
  }

  return value;
}

@Injectable()
export class EnvService {
  constructor(private configService: ConfigService) {}

  get isDev(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }
}
