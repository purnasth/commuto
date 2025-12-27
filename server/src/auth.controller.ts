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
  RefreshTokenDto,
  DeleteAccountDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  // TODO (data_exposure_security): MEDIUM-HIGH SECURITY REVIEW NEEDED
  //
  // CURRENT ISSUE: userWithoutPassword removes only the password field but still exposes:
  // - Internal database IDs (id, createdAt, updatedAt)
  // - Potentially sensitive data: phone numbers, addresses, exact karma/credit scores
  // - Email addresses (which might not always be appropriate for all API responses)
  //
  // RECOMMENDATION: Create proper UserDto/PublicUserDto that only exposes safe fields:
  // - For login/signup: id, fullname, email, role (essential for auth)
  // - For public profiles: id, fullname, role, ratings (no email, phone, address)
  //
  // AFFECTED ENDPOINTS:
  // - POST /auth/login - exposes user object with all fields except password
  // - POST /auth/signup - exposes complete user object except password
  // - GET /auth/me - exposes all user data except password
  // - PUT /auth/user - exposes updated user object except password
  //
  // PRIORITY: MEDIUM-HIGH (less critical than ride controller but still important)
  //
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private configService: ConfigService,
    private envService: EnvService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

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
    if (!user) {
      this.logger.log({
        level: 'warn',
        message: `Login failed for email: ${body.email} - User not found`,
        tag: 'error',
        email: body.email,
      });
      throw new UnauthorizedException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      this.logger.log({
        level: 'warn',
        message: `Login failed for email: ${body.email} - Invalid password`,
        tag: 'error',
        email: body.email,
      });
      throw new UnauthorizedException('Invalid password');
    }
    // Generate JWT tokens
    const accessToken = this.authService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = await this.authService.generateAndStoreRefreshToken(
      user.id,
    );

    // Remove password field from user object for response
    const userWithoutPassword = Object.fromEntries(
      Object.entries(user).filter(([key]) => key !== 'password'),
    );

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
        ratings: body.ratings,
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

    // Remove password field from user object for response
    const userWithoutPassword = Object.fromEntries(
      Object.entries(user).filter(([key]) => key !== 'password'),
    );

    return {
      message: 'Signup successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  @Post('logout')
  async logout(@Body() body: RefreshTokenDto) {
    this.logger.log({
      level: 'info',
      message: `Logout attempt`,
      tag: 'auth',
      refreshToken: body.refreshToken,
    });

    if (!body.refreshToken) {
      throw new BadRequestException('Refresh token is required for logout');
    }

    await this.authService.revokeRefreshToken(body.refreshToken);

    return { message: 'Logout successful' };
  }

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
    // Remove password field from user object for response
    const userWithoutPassword = Object.fromEntries(
      Object.entries(user).filter(([key]) => key !== 'password'),
    );
    return { user: userWithoutPassword };
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Body()
    body: {
      password: string;
      updates: Partial<SignupDto>;
    },
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
    // Prevent updating email and password directly here for security
    const allowedUpdates = { ...body.updates };
    delete allowedUpdates.email;
    delete allowedUpdates.password;
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
    // Remove password field from user object for response
    const userWithoutPassword = Object.fromEntries(
      Object.entries(updatedUser).filter(([key]) => key !== 'password'),
    );
    return { message: 'User updated successfully', user: userWithoutPassword };
  }
}
