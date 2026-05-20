import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private service: SettingsService) {}

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
  update(@Body() body: Record<string, unknown>) {
    return this.service.update(body);
  }
}
