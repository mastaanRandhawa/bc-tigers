import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('teams')
export class TeamsController {
  constructor(private service: TeamsService) {}

  @Get()
  @AdminOnly()
  findAll(@Query('divisionId') divisionId?: string) {
    return this.service.findAll({ divisionId });
  }

  @Get(':slug')
  @AdminOnly()
  findOne(@Param('slug') slug: string) {
    return this.service.findOne(slug);
  }

  @Post()
  @AdminOnly()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
