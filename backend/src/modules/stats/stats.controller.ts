import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private service: StatsService) {}

  @Get('top-scorers')
  topScorers(
    @Query() q: { tournamentId?: string; divisionId?: string; limit?: string },
  ) {
    return this.service.topScorers({
      ...q,
      limit: q.limit ? parseInt(q.limit) : 20,
    });
  }

  @Get('top-assists')
  topAssists(
    @Query() q: { tournamentId?: string; divisionId?: string; limit?: string },
  ) {
    return this.service.topAssists({
      ...q,
      limit: q.limit ? parseInt(q.limit) : 20,
    });
  }

  @Get('discipline')
  discipline(
    @Query() q: { tournamentId?: string; divisionId?: string; limit?: string },
  ) {
    return this.service.discipline({
      ...q,
      limit: q.limit ? parseInt(q.limit) : 20,
    });
  }

  @Get('summary')
  summary() {
    return this.service.summary();
  }
}
