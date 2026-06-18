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
import { AdminOnly } from '../auth/admin.decorator';

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  @AdminOnly()
  findAll(@Query() q: { page?: string; limit?: string }) {
    return this.service.findAll({
      page: Number(q.page ?? 1),
      limit: Number(q.limit ?? 20),
    });
  }

  @Get(':id')
  @AdminOnly()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.service.update(id, b);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
