import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import type { Prisma, MatchStatus, MatchEventType } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { MatchesGateway } from '../../gateways/matches.gateway';
import { BracketsService } from '../brackets/brackets.service';
import { MailService } from '../mail/mail.service';
import { pickAllowed } from '../../common/pick';

/** Client-settable scalar fields on a match. Scores are set via the score/events endpoints. */
const MATCH_FIELDS = [
  'tournament_id',
  'division_id',
  'home_team_id',
  'away_team_id',
  'venue_id',
  'field_id',
  'scheduled_start',
  'scheduled_end',
  'status',
  'round',
  'match_type',
  'stream_url',
] as const;

/** Client-settable scalar fields on a match event. `match_id` is set from the route param. */
const MATCH_EVENT_FIELDS = [
  'player_id',
  'team_id',
  'type',
  'minute',
  'extra_time',
] as const;

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

const TEAM_WITH_PLAYERS = {
  include: {
    players: {
      where: { active: true },
      orderBy: { last_name: 'asc' as const },
    },
  },
};

const MATCH_DETAIL_INCLUDE = {
  home_team: TEAM_WITH_PLAYERS,
  away_team: TEAM_WITH_PLAYERS,
  venue: true,
  officials: true,
  events: {
    include: { player: true, team: true },
    orderBy: { minute: 'asc' as const },
  },
  tournament: true,
  division: true,
} satisfies Prisma.MatchInclude;

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    @Inject(forwardRef(() => MatchesGateway))
    private readonly gateway: MatchesGateway,
    @Inject(forwardRef(() => BracketsService))
    private readonly bracketsService: BracketsService,
    private readonly mailService: MailService,
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
      data: pickAllowed<Prisma.MatchUncheckedCreateInput>(data, MATCH_FIELDS),
      include: MATCH_DETAIL_INCLUDE,
    });
  }

  async update(id: string, data: unknown) {
    const existing = await this.findOne(id);
    const updateData = pickAllowed<Prisma.MatchUncheckedUpdateInput>(
      data,
      MATCH_FIELDS,
    );
    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      include: MATCH_DETAIL_INCLUDE,
    });

    if (updateData.status === 'LIVE' && existing.status !== 'LIVE') {
      await this.gateway.emitMatchStarted(id, match);
      await this.emailAdmins(
        match.tournament_id,
        'Match started',
        `${match.home_team.name} vs ${match.away_team.name} is now live`,
      );
    }

    if (updateData.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      await this.gateway.emitMatchCompleted(id, match.division_id, match);
      await this.emailAdmins(
        match.tournament_id,
        'Match completed',
        `Final: ${match.home_team.name} ${match.home_score} – ${match.away_score} ${match.away_team.name}`,
      );
      await this.advanceBracketFromMatch(match);
    }

    this.gateway.emitScoreUpdate(id, match.home_score, match.away_score);
    return match;
  }

  async updateScore(id: string, homeScore: number, awayScore: number) {
    return this.applyScore(id, homeScore, awayScore, { notify: true });
  }

  async addEvent(matchId: string, data: unknown) {
    const eventData = pickAllowed<Prisma.MatchEventUncheckedCreateInput>(
      data,
      MATCH_EVENT_FIELDS,
    );
    const event = await prisma.matchEvent.create({
      data: { ...eventData, match_id: matchId },
      include: { player: true, team: true },
    });

    const match = await this.findOne(matchId);
    await this.syncScoreFromEvents(matchId);

    await this.gateway.emitMatchEvent({
      matchId,
      divisionId: match.division_id,
      type: eventData.type as MatchEventType,
      data: { matchId, event },
    });

    return event;
  }

  async updateEvent(matchId: string, eventId: string, data: unknown) {
    const existing = await prisma.matchEvent.findFirst({
      where: { id: eventId, match_id: matchId },
    });
    if (!existing) throw new NotFoundException('Match event not found');

    const patch = pickAllowed<Prisma.MatchEventUncheckedUpdateInput>(
      data,
      MATCH_EVENT_FIELDS,
    );
    const event = await prisma.matchEvent.update({
      where: { id: eventId },
      data: patch,
      include: { player: true, team: true },
    });

    const match = await this.findOne(matchId);
    await this.syncScoreFromEvents(matchId);

    await this.gateway.emitMatchEvent({
      matchId,
      divisionId: match.division_id,
      type: event.type,
      data: { matchId, event },
    });

    return event;
  }

  async deleteEvent(matchId: string, eventId: string) {
    const existing = await prisma.matchEvent.findFirst({
      where: { id: eventId, match_id: matchId },
    });
    if (!existing) throw new NotFoundException('Match event not found');

    await prisma.matchEvent.delete({ where: { id: eventId } });

    await this.syncScoreFromEvents(matchId);
    const match = await this.findOne(matchId);
    this.gateway.emitScoreUpdate(matchId, match.home_score, match.away_score);

    return { id: eventId };
  }

  private async syncScoreFromEvents(matchId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return;

    const events = await prisma.matchEvent.findMany({
      where: { match_id: matchId, type: { in: ['GOAL', 'OWN_GOAL'] } },
    });

    let home = 0;
    let away = 0;
    for (const e of events) {
      if (e.type === 'GOAL') {
        if (e.team_id === match.home_team_id) home += 1;
        else if (e.team_id === match.away_team_id) away += 1;
      } else if (e.type === 'OWN_GOAL') {
        if (e.team_id === match.home_team_id) away += 1;
        else if (e.team_id === match.away_team_id) home += 1;
      }
    }

    await this.applyScore(matchId, home, away, { notify: false });
  }

  private async applyScore(
    id: string,
    homeScore: number,
    awayScore: number,
    options: { notify?: boolean },
  ) {
    const match = await prisma.match.update({
      where: { id },
      data: { home_score: homeScore, away_score: awayScore },
      include: MATCH_DETAIL_INCLUDE,
    });

    this.gateway.emitScoreUpdate(id, homeScore, awayScore);

    if (options.notify) {
      await this.emailAdmins(
        match.tournament_id,
        'Score updated',
        `${match.home_team.name} ${homeScore} – ${awayScore} ${match.away_team.name}`,
      );
    }

    return match;
  }

  private async advanceBracketFromMatch(match: {
    id: string;
    division_id: string;
    home_team_id: string;
    away_team_id: string;
    home_score: number;
    away_score: number;
  }) {
    const node = await prisma.bracketNode.findFirst({
      where: { match_id: match.id },
    });
    if (!node) return;

    if (match.home_score === match.away_score) {
      this.logger.warn(`Match ${match.id} completed as draw — bracket not advanced`);
      return;
    }

    const winnerId =
      match.home_score > match.away_score ? match.home_team_id : match.away_team_id;

    try {
      await this.bracketsService.advance(node.id, winnerId);
      this.gateway.emitBracketUpdated(match.division_id, {
        divisionId: match.division_id,
        nodeId: node.id,
        winnerId,
      });
    } catch (err) {
      this.logger.error(`Failed to advance bracket for match ${match.id}`, err);
    }
  }

  private async emailAdmins(
    tournamentId: string,
    title: string,
    message: string,
  ) {
    const admins = await prisma.user.findMany({
      where: { active: true, role: 'ADMIN' },
      select: { email: true },
    });

    for (const admin of admins) {
      if (!admin.email) continue;
      await this.mailService.send({
        to: admin.email,
        subject: title,
        text: message,
      });
    }
  }

  remove(id: string) {
    return prisma.match.delete({ where: { id } });
  }

  async assignOfficial(
    matchId: string,
    data: { name: string; role?: string; email?: string; phone?: string },
  ) {
    await this.findOne(matchId);
    return prisma.matchOfficial.create({
      data: {
        match_id: matchId,
        name: data.name,
        role: data.role ?? 'MAIN',
        email: data.email,
        phone: data.phone,
      },
    });
  }

  async removeOfficial(matchId: string, officialId: string) {
    const record = await prisma.matchOfficial.findFirst({
      where: { id: officialId, match_id: matchId },
    });
    if (!record) throw new NotFoundException('Official assignment not found');
    return prisma.matchOfficial.delete({ where: { id: officialId } });
  }
}
