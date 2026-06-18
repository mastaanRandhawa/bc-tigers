import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import type { Prisma, MatchStatus, MatchEventType } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { MatchesGateway } from '../../gateways/matches.gateway';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

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
  constructor(
    @Inject(forwardRef(() => MatchesGateway))
    private readonly gateway: MatchesGateway,
    private readonly settingsService: SettingsService,
    private readonly notificationsService: NotificationsService,
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
      await this.notifyAdmins(
        match.tournament_id,
        'Match started',
        `${match.home_team.name} vs ${match.away_team.name} is now live`,
      );
    }

    if (updateData.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      await this.gateway.emitMatchCompleted(id, match.division_id, match);
      await this.notifyAdmins(
        match.tournament_id,
        'Match completed',
        `Final: ${match.home_team.name} ${match.home_score} – ${match.away_score} ${match.away_team.name}`,
      );
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
    await this.notifyAdmins(
      match.tournament_id,
      'Score updated',
      `${match.home_team.name} ${homeScore} – ${awayScore} ${match.away_team.name}`,
    );
    return match;
  }

  async addEvent(matchId: string, data: unknown) {
    const eventData = data as Prisma.MatchEventUncheckedCreateInput;
    const event = await prisma.matchEvent.create({
      data: { ...eventData, match_id: matchId },
      include: { player: true, team: true },
    });

    const match = await this.findOne(matchId);

    if (eventData.type === 'GOAL' || eventData.type === 'OWN_GOAL') {
      const homeDelta =
        eventData.type === 'GOAL'
          ? eventData.team_id === match.home_team_id
            ? 1
            : 0
          : eventData.team_id === match.home_team_id
            ? 0
            : 1;
      const awayDelta =
        eventData.type === 'GOAL'
          ? eventData.team_id === match.away_team_id
            ? 1
            : 0
          : eventData.team_id === match.away_team_id
            ? 0
            : 1;

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

    const label = eventData.type.replace(/_/g, ' ');
    await this.notifyAdmins(
      match.tournament_id,
      `Match event: ${label}`,
      `${label} at ${eventData.minute}'`,
    );

    return event;
  }

  private async notifyAdmins(
    tournamentId: string,
    title: string,
    message: string,
  ) {
    const settings = await this.settingsService.getAdmin();
    if (!settings.live_score_updates && !settings.notifications_enabled) return;

    const admins = await prisma.user.findMany({
      where: { active: true, role: 'ADMIN' },
      select: { id: true, email: true },
    });

    for (const admin of admins) {
      const notification = await this.notificationsService.create({
        user_id: admin.id,
        tournament_id: tournamentId,
        title,
        message,
        type: 'MATCH',
      });
      this.gateway.emitNotification(admin.id, notification);

      if (settings.notifications_enabled && admin.email) {
        await this.mailService.send({
          to: admin.email,
          subject: title,
          text: message,
        });
      }
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
