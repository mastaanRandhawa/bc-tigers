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
import { DivisionsService } from './divisions.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller()
export class DivisionsController {
  constructor(private service: DivisionsService) {}

  @Get('tournaments/:tournamentSlug/divisions')
  findByTournament(@Param('tournamentSlug') tournamentSlug: string) {
    return this.service.findByTournament(tournamentSlug);
  }

  @Get('tournaments/:tournamentSlug/divisions/:divisionSlug')
  findOne(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
  ) {
    return this.service.findOne(tournamentSlug, divisionSlug);
  }

  @Get('divisions')
  @AdminOnly()
  findAll() {
    return this.service.findAll();
  }

  @Post('divisions')
  @AdminOnly()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(
      body as Parameters<DivisionsService['create']>[0],
    );
  }

  @Patch('divisions/:id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body);
  }

  @Delete('divisions/:id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('divisions/:id/generate-schedule')
  @AdminOnly()
  generateSchedule(
    @Param('id') id: string,
    @Body()
    body: {
      startDate?: string;
      matchIntervalMinutes?: number;
      venueId?: string;
      fieldId?: string;
    },
    @Query('force') force?: string,
  ) {
    return this.service.generateSchedule(id, { ...body, force: force === 'true' });
  }
}
