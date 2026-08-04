import { createHash, randomUUID } from 'crypto';

import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { PrismaService } from '../prisma.service';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { requireSecret } from '../env.service';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  /**
   * Generate access token (short-lived, 1 hour)
   */
  generateAccessToken(userId: number, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: requireSecret(this.configService, 'JWT_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ||
          '1h') as StringValue,
      },
    );
  }

  /**
   * Refresh tokens are high-entropy signed JWTs, so a single SHA-256 pass is
   * enough to make the stored value useless if the table leaks. A slow hash
   * such as bcrypt would buy nothing here -- there is no low-entropy secret to
   * protect -- and would have to be run against every candidate row.
   */
  private static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Issues a refresh token and records its hash.
   *
   * `familyId` ties together every token descended from one login so the whole
   * chain can be revoked at once if any link is later replayed.
   */
  async generateAndStoreRefreshToken(
    userId: number,
    familyId: string = randomUUID(),
  ): Promise<string> {
    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh', jti: randomUUID() },
      {
        secret: requireSecret(this.configService, 'JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
          '30d') as StringValue,
      },
    );

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS,
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: AuthService.hashToken(refreshToken),
        familyId,
        userId,
        expiresAt,
      },
    });

    return refreshToken;
  }

  /**
   * Exchanges a refresh token for a new access token and a new refresh token.
   *
   * The presented token is revoked as part of the exchange, so each one is
   * usable exactly once. Presenting an already-revoked token means the value
   * was captured and replayed, and the entire family is revoked in response --
   * a stolen token can therefore be used at most once before it locks both the
   * attacker and the victim out, which surfaces the theft.
   */
  async rotateRefreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      this.jwtService.verify(refreshToken, {
        secret: requireSecret(this.configService, 'JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      this.logger.error(
        `Refresh token verification failed: ${(error as Error).message}`,
        'auth',
      );

      throw new UnauthorizedException('Refresh token verification failed');
    }

    const tokenHash = AuthService.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!stored) {
      throw new UnauthorizedException(
        'Refresh token not found or has been revoked',
      );
    }

    if (stored.revokedAt) {
      this.logger.log({
        level: 'warn',
        message: `Replayed refresh token detected; revoking family`,
        tag: 'auth',
        userId: stored.userId,
        familyId: stored.familyId,
      });

      await this.revokeFamily(stored.familyId);

      throw new UnauthorizedException(
        'Refresh token has already been used. Please sign in again.',
      );
    }

    if (stored.expiresAt < new Date()) {
      await this.revokeFamily(stored.familyId);

      throw new UnauthorizedException('Refresh token expired');
    }

    // Mark spent before issuing the replacement, so a token can never be
    // exchanged twice even if two requests arrive together.
    const spent = await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (spent.count === 0) {
      throw new UnauthorizedException(
        'Refresh token has already been used. Please sign in again.',
      );
    }

    return {
      accessToken: this.generateAccessToken(stored.user.id, stored.user.email),
      refreshToken: await this.generateAndStoreRefreshToken(
        stored.userId,
        stored.familyId,
      ),
    };
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke a refresh token and its whole rotation family (logout).
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: AuthService.hashToken(refreshToken) },
      select: { familyId: true },
    });

    if (stored) {
      await this.revokeFamily(stored.familyId);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
