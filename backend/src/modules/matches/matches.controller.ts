import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { AdminOnly } from '../auth/admin.decorator';
import { RefereeOrAdmin } from '../auth/referee-or-admin.decorator';
import type { MatchStatus, UserRole } from '@prisma/client';

type AuthUser = { userId: string; role: UserRole };

@Controller('matches')
export class MatchesController {
  constructor(private service: MatchesService) {}

  @Get()
  @AdminOnly()
  findAll(
    @Query()
    q: {
      status?: MatchStatus;
      statuses?: string;
      tournamentId?: string;
      divisionId?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const statuses = q.statuses
      ? (q.statuses.split(',').filter(Boolean) as MatchStatus[])
      : undefined;
    return this.service.findAll({
      status: q.status,
      statuses,
      tournamentId: q.tournamentId,
      divisionId: q.divisionId,
      page: Number(q.page ?? 1),
      limit: Number(q.limit ?? 20),
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @AdminOnly()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body);
  }

  @Patch(':id')
  @RefereeOrAdmin()
  update(
    @Request() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.update(id, body, req.user);
  }

  @Patch(':id/score')
  @RefereeOrAdmin()
  updateScore(
    @Request() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() body: { home_score: number; away_score: number },
  ) {
    return this.service.updateScore(id, body.home_score, body.away_score, req.user);
  }

  @Post(':matchId/events')
  @RefereeOrAdmin()
  addEvent(
    @Request() req: { user: AuthUser },
    @Param('matchId') matchId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.addEvent(matchId, body, req.user);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
