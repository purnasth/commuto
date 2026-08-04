import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { PrismaService } from './prisma.service';

/**
 * Liveness and readiness probes.
 *
 * Kept separate so an orchestrator can tell "the process is up" apart from
 * "the process can actually serve traffic". Restarting a container whose only
 * problem is an unreachable database helps nobody, so liveness deliberately
 * touches nothing external.
 *
 * Both skip rate limiting: probes run continuously and would otherwise consume
 * the caller's budget and start failing under their own load.
 */
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: the event loop is responsive. No dependencies checked. */
  @Get()
  live() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  /** Readiness: dependencies this instance needs to serve a request. */
  @Get('ready')
  async ready() {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'unavailable',
        database: 'unreachable',
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }

    return {
      status: 'ok',
      database: 'ok',
      databaseLatencyMs: Date.now() - startedAt,
    };
  }
}
