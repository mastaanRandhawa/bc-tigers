import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private service: AuditLogService) {}

  @Get()
  @AdminOnly()
  findAll(
    @Query()
    query: {
      userId?: string;
      entity?: string;
      entityId?: string;
      limit?: string;
    },
  ) {
    return this.service.findAll({
      userId: query.userId,
      entity: query.entity,
      entityId: query.entityId,
      limit: query.limit ? parseInt(query.limit) : 50,
    });
  }
}
