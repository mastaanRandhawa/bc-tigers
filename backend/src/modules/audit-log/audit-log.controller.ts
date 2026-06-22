import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller()
export class AuditLogController {
  constructor(private service: AuditLogService) {}

  @Get('audit-logs')
  @AdminOnly()
  findAll(
    @Query()
    query: {
      userId?: string;
      entity?: string;
      entityId?: string;
      action?: string;
      source?: string;
      limit?: string;
    },
  ) {
    return this.service.findAll({
      userId: query.userId,
      entity: query.entity,
      entityId: query.entityId,
      action: query.action,
      source: query.source,
      limit: query.limit ? parseInt(query.limit) : 50,
    });
  }

  /** Immutable version history for a single record. */
  @Get('record-versions')
  @AdminOnly()
  listVersions(@Query() query: { entityType?: string; entityId?: string }) {
    if (!query.entityType || !query.entityId) return [];
    return this.service.listVersions(query.entityType, query.entityId);
  }

  @Get('record-versions/:id')
  @AdminOnly()
  getVersion(@Param('id') id: string) {
    return this.service.getVersion(id);
  }
}
