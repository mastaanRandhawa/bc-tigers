import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('matches/:matchId/referees')
export class MatchRefereesController {
  constructor(private service: MatchesService) {}

  @Post()
  @AdminOnly()
  assign(
    @Param('matchId') matchId: string,
    @Body() body: { referee_id: string; role?: string },
  ) {
    return this.service.assignReferee(matchId, body.referee_id, body.role);
  }

  @Delete(':matchRefereeId')
  @AdminOnly()
  remove(
    @Param('matchId') matchId: string,
    @Param('matchRefereeId') matchRefereeId: string,
  ) {
    return this.service.removeReferee(matchId, matchRefereeId);
  }
}
