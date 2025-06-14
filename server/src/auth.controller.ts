import {
  Get,
  Put,
  Post,
  Body,
  Delete,
  Controller,
  BadRequestException,
  UnauthorizedException,
  Query,
  Inject,
} from '@nestjs/common';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

interface LoginDto {
  email: string;
  password: string;
}

interface SignupDto {
  fullname: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  ratings?: number;
}

@Controller('auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto & { recaptchaToken?: string }) {
    this.logger.log({
      level: 'info',
      message: `Login attempt for email: ${body.email}`,
      tag: 'auth',
      email: body.email,
    });
    // Verify reCAPTCHA v2
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
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      this.logger.log({
        level: 'warn',
        message: `Login failed for email: ${body.email} - Invalid password`,
        tag: 'error',
        email: body.email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }
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
    return { message: 'Login successful', user: userWithoutPassword };
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
    // Use static import for bcrypt for better performance
    const hashedPassword = await bcrypt.hash(body.password, 10);
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
    return { message: 'Signup successful', user: userWithoutPassword };
  }

  @Post('logout')
  logout(@Body() body: { email?: string }) {
    this.logger.log({
      level: 'info',
      message: `Logout${body?.email ? ` for email: ${body.email}` : ''}`,
      tag: 'auth',
      ...(body?.email ? { email: body.email } : {}),
    });
    return { message: 'Logout successful' };
  }

  @Delete('delete')
  async deleteAccount(@Body() body: { email: string; password: string }) {
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
  async getUser(@Query('email') email: string) {
    this.logger.log({
      level: 'info',
      message: `Get user profile for email: ${email}`,
      tag: 'auth',
      email,
    });
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      this.logger.log({
        level: 'warn',
        message: `Get user failed for email: ${email} - User not found`,
        tag: 'error',
        email,
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
  async updateUser(
    @Body()
    body: {
      email: string;
      password: string;
      updates: Partial<SignupDto>;
    },
  ) {
    this.logger.log({
      level: 'info',
      message: `Update user attempt for email: ${body.email}`,
      tag: 'auth',
      email: body.email,
    });
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user) {
      this.logger.log({
        level: 'warn',
        message: `Update user failed for email: ${body.email} - User not found`,
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
        message: `Update user failed for email: ${body.email} - Invalid password`,
        tag: 'error',
        email: body.email,
      });
      throw new UnauthorizedException('Invalid password');
    }
    // Prevent updating email and password directly here for security
    const allowedUpdates = { ...body.updates };
    delete allowedUpdates.email;
    delete allowedUpdates.password;
    const updatedUser = await this.prisma.user.update({
      where: { email: body.email },
      data: allowedUpdates,
    });
    this.logger.log({
      level: 'info',
      message: `User updated for email: ${body.email}`,
      tag: 'auth',
      email: body.email,
      userId: user.id,
    });
    // Remove password field from user object for response
    const userWithoutPassword = Object.fromEntries(
      Object.entries(updatedUser).filter(([key]) => key !== 'password'),
    );
    return { message: 'User updated successfully', user: userWithoutPassword };
  }
}
