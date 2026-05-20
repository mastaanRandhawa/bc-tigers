import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SuperAdminOnly } from '../auth/admin.decorator';

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}
  @Get() @SuperAdminOnly() findAll(
    @Query() q: { page?: string; limit?: string },
  ) {
    return this.service.findAll({
      page: Number(q.page ?? 1),
      limit: Number(q.limit ?? 20),
    });
  }
  @Get(':id') @SuperAdminOnly() findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id') @SuperAdminOnly() update(
    @Param('id') id: string,
    @Body() b: Record<string, unknown>,
  ) {
    return this.service.update(id, b);
  }
  @Patch(':id/link') @SuperAdminOnly() linkEntity(
    @Param('id') id: string,
    @Body() body: { entity_type: 'player' | 'coach' | 'referee'; entity_id: string },
  ) {
    return this.service.linkEntity(id, body);
  }
  @Delete(':id') @SuperAdminOnly() remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
