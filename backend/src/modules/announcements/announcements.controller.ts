import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AdminOnly } from '../auth/admin.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private service: AnnouncementsService,
    private auditLog: AuditLogService,
  ) {}

  @Get()
  findAll(@Query() q: { tournamentId?: string; limit?: string }) {
    return this.service.findAll({
      tournamentId: q.tournamentId,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @AdminOnly()
  async create(
    @Request() req: { user: { userId: string } },
    @Body()
    body: {
      title: string;
      message: string;
      type?: string;
      tournament_id?: string | null;
    },
  ) {
    const announcement = await this.service.create(body);
    await this.auditLog.log({
      userId: req.user.userId,
      action: 'CREATE',
      entity: 'Announcement',
      entityId: announcement.id,
    });
    return announcement;
  }

  @Patch(':id')
  @AdminOnly()
  async update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      message?: string;
      type?: string;
      tournament_id?: string | null;
    },
  ) {
    const announcement = await this.service.update(id, body);
    await this.auditLog.log({
      userId: req.user.userId,
      action: 'UPDATE',
      entity: 'Announcement',
      entityId: id,
    });
    return announcement;
  }

  @Delete(':id')
  @AdminOnly()
  async remove(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    const result = await this.service.remove(id);
    await this.auditLog.log({
      userId: req.user.userId,
      action: 'DELETE',
      entity: 'Announcement',
      entityId: id,
    });
    return result;
  }
}
