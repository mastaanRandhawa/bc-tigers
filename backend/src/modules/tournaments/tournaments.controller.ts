import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('tournaments')
export class TournamentsController {
  constructor(private service: TournamentsService) {}

  @Get()
  findAll(@Query() query: { status?: string; page?: string; limit?: string }) {
    return this.service.findAll({
      status: query.status,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    });
  }

  @Get(':slug/overview')
  getOverview(@Param('slug') slug: string) {
    return this.service.getOverview(slug);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findOne(slug);
  }

  @Post()
  @AdminOnly()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(
      body as Parameters<TournamentsService['create']>[0],
    );
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
