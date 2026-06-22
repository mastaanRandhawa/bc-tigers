import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('matches/:matchId/officials')
export class MatchOfficialsController {
  constructor(private service: MatchesService) {}

  @Post()
  @AdminOnly()
  assign(
    @Param('matchId') matchId: string,
    @Body()
    body: { name: string; role?: string; email?: string; phone?: string },
  ) {
    return this.service.assignOfficial(matchId, body);
  }

  @Delete(':officialId')
  @AdminOnly()
  remove(
    @Param('matchId') matchId: string,
    @Param('officialId') officialId: string,
  ) {
    return this.service.removeOfficial(matchId, officialId);
  }
}
