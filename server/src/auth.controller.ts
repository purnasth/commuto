import {
  Get,
  Put,
  Post,
  Body,
  Delete,
  Inject,
  Request,
  UseGuards,
  Controller,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

import { EnvService } from './env.service';
import { PrismaService } from './prisma.service';
import { AuthService } from './services/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthenticatedRequest } from './interfaces/types';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import {
  LoginDto,
  SignupDto,
  UpdateUserDto,
  RefreshTokenDto,
  DeleteAccountDto,
} from './dto/auth.dto';
import { toAuthUser } from './dto/user-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private configService: ConfigService,
    private envService: EnvService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  // Credential guessing is cheap without a ceiling: reCAPTCHA is skipped
  // entirely in development and is not a substitute for rate limiting.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  async login(@Body() body: LoginDto) {
    this.logger.log({
      level: 'info',
      message: `Login attempt for email: ${body.email}`,
      tag: 'auth',
      email: body.email,
    });

    if (!this.envService.isDev) {
      const recaptchaSecret = this.configService.get<string>(
        'RECAPTCHA_SECRET_KEY',
      );

      if (!body.recaptchaToken) {
        this.logger.log({
          level: 'warn',
          message: `Login failed for email: ${body.email} - Missing reCAPTCHA token`,
          tag: 'auth',
          email: body.email,
        });

        throw new BadRequestException('Missing reCAPTCHA token');
      }
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
      let response: any;
      try {
        response = await axios.post(
          verifyUrl,
          new URLSearchParams({
            secret: recaptchaSecret || '',
            response: body.recaptchaToken,
          }),
        );
      } catch {
        this.logger.log({
          level: 'error',
          message: `Login failed for email: ${body.email} - reCAPTCHA verification request failed`,
          tag: 'error',
          email: body.email,
        });
        throw new UnauthorizedException('Failed to verify reCAPTCHA');
      }
      // Safely extract response.data
      let data: Record<string, any> | undefined = undefined;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as { data: Record<string, any> }).data;
      }
      if (!data || !data.success) {
        this.logger.log({
          level: 'error',
          message: `Login failed for email: ${body.email} - reCAPTCHA verification failed: ${JSON.stringify(
            data,
          )}`,
          tag: 'error',
          email: body.email,
        });
        throw new UnauthorizedException('reCAPTCHA verification failed');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    // The reason is logged but never returned: distinct "user not found" and
    // "invalid password" replies let anyone test which emails hold an account.
    if (!user) {
      this.logger.log({
        level: 'warn',
        message: `Login failed for email: ${body.email} - User not found`,
        tag: 'error',
        email: body.email,
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      this.logger.log({
        level: 'warn',
        message: `Login failed for email: ${body.email} - Invalid password`,
        tag: 'error',
        email: body.email,
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    // Generate JWT tokens
    const accessToken = this.authService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = await this.authService.generateAndStoreRefreshToken(
      user.id,
    );

    // Explicit whitelist: new columns on User are not exposed by default
    const userWithoutPassword = toAuthUser(user);

    this.logger.log({
      level: 'info',
      message: `Login successful for email: ${body.email}`,
      tag: 'auth',
      email: body.email,
      userId: user.id,
    });

    return {
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  @Throttle({ default: { ttl: 3_600_000, limit: 10 } })
  @Post('signup')
  async signup(@Body() body: SignupDto) {
    this.logger.log({
      level: 'info',
      message: `Signup attempt for email: ${body.email}, fullname: ${body.fullname}`,
      tag: 'auth',
      email: body.email,
      fullname: body.fullname,
    });

    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      this.logger.log({
        level: 'warn',
        message: `Signup failed for email: ${body.email} - Email already registered`,
        tag: 'error',
        email: body.email,
      });

      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(
      body.password,
      AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS,
    );

    const user = await this.prisma.user.create({
      data: {
        fullname: body.fullname,
        email: body.email,
        password: hashedPassword,
        role: body.role,
        phone: body.phone,
        address: body.address,
        profilePicture: body.profilePicture,
        // ratings is intentionally not set from the request: it is earned
        // from other users' feedback, not self-declared.
      },
    });
    // Generate JWT tokens
    const accessToken = this.authService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = await this.authService.generateAndStoreRefreshToken(
      user.id,
    );

    this.logger.log({
      level: 'info',
      message: `Signup successful for email: ${body.email}, fullname: ${body.fullname}`,
      tag: 'auth',
      email: body.email,
      userId: user.id,
    });

    // Explicit whitelist: new columns on User are not exposed by default
    const userWithoutPassword = toAuthUser(user);

    return {
      message: 'Signup successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  @Post('logout')
  async logout(@Body() body: RefreshTokenDto) {
    // Never log the refresh token itself: it is a bearer credential valid for
    // 30 days, and application logs are readable over the /logs endpoints.
    this.logger.log({
      level: 'info',
      message: `Logout attempt`,
      tag: 'auth',
    });

    if (!body.refreshToken) {
      throw new BadRequestException('Refresh token is required for logout');
    }

    await this.authService.revokeRefreshToken(body.refreshToken);

    return { message: 'Logout successful' };
  }

  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('refresh')
  async refreshToken(@Body() body: RefreshTokenDto) {
    this.logger.log({
      level: 'info',
      message: 'Refresh token request',
      tag: 'auth',
    });

    if (!body.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const accessToken = await this.authService.refreshAccessToken(
        body.refreshToken,
      );

      this.logger.log({
        level: 'info',
        message: 'Access token refreshed successfully',
        tag: 'auth',
      });

      return {
        message: 'Token refreshed successfully',
        accessToken,
      };
    } catch (error) {
      this.logger.log({
        level: 'error',
        message: `Refresh token verification failed: ${error}`,
        tag: 'error',
      });

      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Delete('delete')
  async deleteAccount(@Body() body: DeleteAccountDto) {
    this.logger.log({
      level: 'info',
      message: `Delete account attempt for email: ${body.email}`,
      tag: 'auth',
      email: body.email,
    });
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user) {
      this.logger.log({
        level: 'warn',
        message: `Delete account failed for email: ${body.email} - User not found`,
        tag: 'error',
        email: body.email,
      });
      throw new BadRequestException('User not found');
    }
    const isPasswordValid = await (
      await import('bcrypt')
    ).compare(body.password, user.password);
    if (!isPasswordValid) {
      this.logger.log({
        level: 'warn',
        message: `Delete account failed for email: ${body.email} - Invalid password`,
        tag: 'error',
        email: body.email,
      });
      throw new UnauthorizedException('Invalid password');
    }

    // Revoke all refresh tokens before deleting user
    await this.authService.revokeAllUserTokens(user.id);

    await this.prisma.user.delete({
      where: { email: body.email },
    });
    this.logger.log({
      level: 'info',
      message: `Account deleted for email: ${body.email}`,
      tag: 'auth',
      email: body.email,
      userId: user.id,
    });
    return { message: 'Account deleted successfully' };
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUser(@Request() req: AuthenticatedRequest) {
    const authenticatedUserId = req.user.userId;
    this.logger.log({
      level: 'info',
      message: `Get user profile for userId: ${authenticatedUserId}`,
      tag: 'auth',
      userId: authenticatedUserId,
    });
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUserId },
    });
    if (!user) {
      this.logger.log({
        level: 'warn',
        message: `Get user failed for userId: ${authenticatedUserId} - User not found`,
        tag: 'error',
        userId: authenticatedUserId,
      });
      throw new BadRequestException('User not found');
    }
    // Explicit whitelist: new columns on User are not exposed by default
    const userWithoutPassword = toAuthUser(user);
    return { user: userWithoutPassword };
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Body() body: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const authenticatedUserId = req.user.userId;
    const authenticatedEmail = req.user.email;
    this.logger.log({
      level: 'info',
      message: `Update user attempt for authenticated user`,
      tag: 'auth',
      userId: authenticatedUserId,
      email: authenticatedEmail,
    });
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUserId },
    });
    if (!user) {
      this.logger.log({
        level: 'warn',
        message: `Update user failed - User not found`,
        tag: 'error',
        userId: authenticatedUserId,
      });
      throw new BadRequestException('User not found');
    }
    const isPasswordValid = await (
      await import('bcrypt')
    ).compare(body.password, user.password);
    if (!isPasswordValid) {
      this.logger.log({
        level: 'warn',
        message: `Update user failed - Invalid password`,
        tag: 'error',
        userId: authenticatedUserId,
      });
      throw new UnauthorizedException('Invalid password');
    }
    // Build the update explicitly rather than spreading the request body: only
    // these four columns are ever writable here, whatever else was sent.
    // Email and password have their own flows; role, ratings, karmaPoints and
    // creditScore are system-owned.
    const { fullname, phone, address, profilePicture } = body.updates;
    const allowedUpdates = {
      ...(fullname !== undefined && { fullname }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(profilePicture !== undefined && { profilePicture }),
    };
    const updatedUser = await this.prisma.user.update({
      where: { id: authenticatedUserId },
      data: allowedUpdates,
    });
    this.logger.log({
      level: 'info',
      message: `User updated for email: ${authenticatedEmail}`,
      tag: 'auth',
      email: authenticatedEmail,
      userId: authenticatedUserId,
    });
    // Explicit whitelist: new columns on User are not exposed by default
    const userWithoutPassword = toAuthUser(updatedUser);
    return { message: 'User updated successfully', user: userWithoutPassword };
  }
}
