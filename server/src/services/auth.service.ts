import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { PrismaService } from '../prisma.service';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
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
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ||
          '1h') as StringValue,
      },
    );
  }

  /**
   * Generate refresh token (long-lived, 30 days) and store in database
   */
  async generateAndStoreRefreshToken(userId: number): Promise<string> {
    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
          '30d') as StringValue,
      },
    );

    // Calculate expiration date using constant
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS,
    );

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return refreshToken;
  }

  /**
   * Verify and refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    // Verify the refresh token
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      this.logger.error(
        `Refresh token verification failed: ${(error as Error).message}`,
        'auth',
      );

      throw new UnauthorizedException('Refresh token verification failed');
    }

    // Check if refresh token exists in database and is not expired
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException(
        'Refresh token not found or has been revoked',
      );
    }

    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new access token
    return this.generateAccessToken(
      storedToken.user.id,
      storedToken.user.email,
    );
  }

  /**
   * Revoke refresh token (for logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
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
