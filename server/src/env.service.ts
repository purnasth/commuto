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

/**
 * Origins permitted to call the API, read from CORS_ORIGINS as a
 * comma-separated list.
 *
 * Returning `true` (reflect any origin) is the development default only.
 * Outside development an empty list is treated as a misconfiguration rather
 * than as "allow everything", so a deploy that forgets the variable fails
 * closed instead of silently opening the API to every site.
 */
export function resolveCorsOrigins(
  configService: ConfigService,
): string[] | boolean {
  const raw = configService.get<string>('CORS_ORIGINS');
  const origins = (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length > 0) {
    return origins;
  }

  if (configService.get<string>('NODE_ENV') === 'development') {
    return true;
  }

  throw new Error(
    'CORS_ORIGINS must list the allowed origins outside development, ' +
      'e.g. CORS_ORIGINS="https://commuto.app,https://www.commuto.app"',
  );
}

@Injectable()
export class EnvService {
  constructor(private configService: ConfigService) {}

  get isDev(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }
}
