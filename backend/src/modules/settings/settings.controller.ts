import { Controller, Get, Patch, Body, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AdminOnly } from '../auth/admin.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('settings')
export class SettingsController {
  constructor(
    private service: SettingsService,
    private auditLog: AuditLogService,
  ) {}

  @Get('public')
  getPublic() {
    return this.service.getPublic();
  }

  @Get()
  @AdminOnly()
  getAdmin() {
    return this.service.getAdmin();
  }

  @Patch()
  @AdminOnly()
  async update(
    @Request() req: { user: { userId: string } },
    @Body() body: Record<string, unknown>,
  ) {
    const settings = await this.service.update(body);
    await this.auditLog.log({
      userId: req.user.userId,
      action: 'UPDATE',
      entity: 'SiteSettings',
      entityId: 'default',
    });
    return settings;
  }
}
