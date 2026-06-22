import { Module } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { AuditableService } from './auditable.service';

@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditableService],
  exports: [AuditLogService, AuditableService],
})
export class AuditLogModule {}
