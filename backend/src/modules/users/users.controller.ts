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
import { UsersService } from './users.service';
import { AdminOnly } from '../auth/admin.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(
    private service: UsersService,
    private auditLog: AuditLogService,
  ) {}

  @Get()
  @AdminOnly()
  findAll(
    @Query()
    q: {
      page?: string;
      limit?: string;
      role?: UserRole;
      approved?: string;
    },
  ) {
    return this.service.findAll({
      page: Number(q.page ?? 1),
      limit: Number(q.limit ?? 20),
      role: q.role,
      approved:
        q.approved === undefined ? undefined : q.approved === 'true',
    });
  }

  @Post()
  @AdminOnly()
  async create(
    @Request() req: { user: { userId: string } },
    @Body()
    body: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      phone?: string;
      role?: UserRole;
    },
  ) {
    const user = await this.service.create(body);
    await this.auditLog.log({
      userId: req.user.userId,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
    });
    return user;
  }

  @Patch(':id')
  @AdminOnly()
  async update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() b: Record<string, unknown>,
  ) {
    const user = await this.service.update(id, b);
    await this.auditLog.log({
      userId: req.user.userId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
    });
    return user;
  }

  @Patch(':id/approve')
  @AdminOnly()
  async approve(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    const user = await this.service.approve(id);
    await this.auditLog.log({
      userId: req.user.userId,
      action: 'APPROVE',
      entity: 'User',
      entityId: id,
    });
    return user;
  }

  @Post(':id/reset-password')
  @AdminOnly()
  async resetPassword(
    @Request() req: { user: { userId: string; role: UserRole } },
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    const user = await this.service.resetPassword(
      req.user.userId,
      id,
      body.password,
    );
    await this.auditLog.log({
      userId: req.user.userId,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: id,
    });
    return user;
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
      entity: 'User',
      entityId: id,
    });
    return result;
  }
}
