import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import type { Prisma, MatchStatus, MatchEventType } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { MatchesGateway } from '../../gateways/matches.gateway';

/** Lightweight payload for lists, tickers, and home feed */
const MATCH_LIST_INCLUDE = {
  home_team: { select: { id: true, name: true, slug: true, logo: true } },
  away_team: { select: { id: true, name: true, slug: true, logo: true } },
  venue: { select: { id: true, name: true, slug: true } },
  tournament: { select: { id: true, name: true, slug: true } },
  division: {
    select: {
      id: true,
      slug: true,
      name: true,
      tournament: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.MatchInclude;

/** Full payload for match detail pages */
const MATCH_DETAIL_INCLUDE = {
  home_team: true,
  away_team: true,
  venue: true,
  referees: { include: { referee: true } },
  events: {
    include: { player: true, team: true },
    orderBy: { minute: 'asc' as const },
  },
  tournament: true,
  division: true,
} satisfies Prisma.MatchInclude;

@Injectable()
export class MatchesService {
  constructor(
    @Inject(forwardRef(() => MatchesGateway))
    private readonly gateway: MatchesGateway,
  ) {}

  findAll(params?: {
    status?: MatchStatus;
    statuses?: MatchStatus[];
    tournamentId?: string;
    divisionId?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params ?? {};
    const where: Prisma.MatchWhereInput = {};
    if (params?.statuses?.length) {
      where.status = { in: params.statuses };
    } else if (params?.status) {
      where.status = params.status;
    }
    if (params?.tournamentId) where.tournament_id = params.tournamentId;
    if (params?.divisionId) where.division_id = params.divisionId;

    return prisma.match.findMany({
      where,
      include: MATCH_LIST_INCLUDE,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { scheduled_start: 'desc' },
    });
  }

  async findOne(id: string) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: MATCH_DETAIL_INCLUDE,
    });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  create(data: unknown) {
    return prisma.match.create({
      data: data as Prisma.MatchCreateInput,
      include: MATCH_DETAIL_INCLUDE,
    });
  }

  async update(id: string, data: unknown) {
    const existing = await this.findOne(id);
    const updateData = data as Prisma.MatchUpdateInput;
    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      include: MATCH_DETAIL_INCLUDE,
    });

    if (updateData.status === 'LIVE' && existing.status !== 'LIVE') {
      await this.gateway.emitMatchStarted(id, match);
    }

    if (updateData.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      await this.gateway.emitMatchCompleted(id, match.division_id, match);
    }

    this.gateway.emitScoreUpdate(id, match.home_score, match.away_score);
    return match;
  }

  async updateScore(id: string, homeScore: number, awayScore: number) {
    const match = await prisma.match.update({
      where: { id },
      data: { home_score: homeScore, away_score: awayScore },
      include: MATCH_DETAIL_INCLUDE,
    });

    this.gateway.emitScoreUpdate(id, homeScore, awayScore);
    return match;
  }

  async addEvent(matchId: string, data: unknown) {
    const eventData = data as Prisma.MatchEventUncheckedCreateInput;
    const event = await prisma.matchEvent.create({
      data: {
        ...eventData,
        match_id: matchId,
      },
      include: { player: true, team: true },
    });

    const match = await this.findOne(matchId);

    if (eventData.type === 'GOAL' || eventData.type === 'OWN_GOAL') {
      const homeDelta = eventData.type === 'GOAL'
        ? eventData.team_id === match.home_team_id ? 1 : 0
        : eventData.team_id === match.home_team_id ? 0 : 1;
      const awayDelta = eventData.type === 'GOAL'
        ? eventData.team_id === match.away_team_id ? 1 : 0
        : eventData.team_id === match.away_team_id ? 0 : 1;

      if (homeDelta || awayDelta) {
        await this.updateScore(
          matchId,
          match.home_score + homeDelta,
          match.away_score + awayDelta,
        );
      }
    }

    await this.gateway.emitMatchEvent({
      matchId,
      divisionId: match.division_id,
      type: eventData.type as MatchEventType,
      data: event,
    });

    return event;
  }

  remove(id: string) {
    return prisma.match.delete({ where: { id } });
  }

  async assignReferee(matchId: string, refereeId: string, role = 'MAIN') {
    await this.findOne(matchId);
    const referee = await prisma.referee.findUnique({ where: { id: refereeId } });
    if (!referee) throw new NotFoundException('Referee not found');

    return prisma.matchReferee.create({
      data: { match_id: matchId, referee_id: refereeId, role },
      include: { referee: true, match: { include: MATCH_DETAIL_INCLUDE } },
    });
  }

  async removeReferee(matchId: string, matchRefereeId: string) {
    const record = await prisma.matchReferee.findFirst({
      where: { id: matchRefereeId, match_id: matchId },
    });
    if (!record) throw new NotFoundException('Referee assignment not found');
    return prisma.matchReferee.delete({ where: { id: matchRefereeId } });
  }
}
