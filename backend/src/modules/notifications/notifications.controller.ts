import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: { user: { userId: string } }) {
    return this.service.findForUser(req.user.userId);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  markAllRead(@Request() req: { user: { userId: string } }) {
    return this.service.markAllRead(req.user.userId);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.service.markRead(req.user.userId, id);
  }

  @Post()
  @AdminOnly()
  create(
    @Body()
    body: {
      user_id?: string;
      tournament_id?: string;
      title: string;
      message: string;
      type?: string;
    },
  ) {
    return this.service.create(body);
  }
}
