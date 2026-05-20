import { Controller, Get, Post, Param } from '@nestjs/common';
import { StandingsService } from './standings.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('standings')
export class StandingsController {
  constructor(private service: StandingsService) {}

  @Get(':divisionId')
  getByDivision(@Param('divisionId') divisionId: string) {
    return this.service.getByDivision(divisionId);
  }

  @Post(':divisionId/recalculate')
  @AdminOnly()
  recalculate(@Param('divisionId') divisionId: string) {
    return this.service.recalculate(divisionId);
  }
}
