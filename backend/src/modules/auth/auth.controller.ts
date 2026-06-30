import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterCoachDto } from './dto/register-coach.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Tight limit on auth endpoints to blunt brute-force / enumeration / spam.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register-coach')
  registerCoach(@Body() body: RegisterCoachDto) {
    return this.authService.registerCoach(body);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Request() req: { user: { userId: string } }) {
    return this.authService.logout(req.user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: { user: { userId: string } }) {
    return this.authService.getMe(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @Request() req: { user: { userId: string } },
    @Body() body: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Request() req: { user: { userId: string } },
    @Body() body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.userId,
      body.current_password,
      body.new_password,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
