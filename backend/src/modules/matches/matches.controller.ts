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
  UseGuards,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { AdminOnly } from '../auth/admin.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { MatchStatus } from '@prisma/client';

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
  @AdminOnly()
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body);
  }

  @Patch(':id/score')
  @AdminOnly()
  updateScore(
    @Param('id') id: string,
    @Body()
    body: {
      home_score: number;
      away_score: number;
      home_penalties?: number | null;
      away_penalties?: number | null;
    },
  ) {
    return this.service.updateScore(
      id,
      body.home_score,
      body.away_score,
      {
        home_penalties: body.home_penalties,
        away_penalties: body.away_penalties,
      },
    );
  }

  @Post(':matchId/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'COACH')
  addEvent(
    @Param('matchId') matchId: string,
    @Body() body: Record<string, unknown>,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.service.addEvent(matchId, body, req.user);
  }

  @Patch(':matchId/events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'COACH')
  updateEvent(
    @Param('matchId') matchId: string,
    @Param('eventId') eventId: string,
    @Body() body: Record<string, unknown>,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.service.updateEvent(matchId, eventId, body, req.user);
  }

  @Delete(':matchId/events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'COACH')
  deleteEvent(
    @Param('matchId') matchId: string,
    @Param('eventId') eventId: string,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.service.deleteEvent(matchId, eventId, req.user);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
