import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    body: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      phone?: string;
    },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
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
    @Body()
    body: {
      first_name?: string;
      last_name?: string;
      phone?: string;
      profile_image?: string;
    },
  ) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Request() req: { user: { userId: string } },
    @Body() body: { current_password: string; new_password: string },
  ) {
    return this.authService.changePassword(
      req.user.userId,
      body.current_password,
      body.new_password,
    );
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
