import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import type { Prisma, MatchStatus, MatchEventType, UserRole } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { MatchesGateway } from '../../gateways/matches.gateway';
import { MeService } from '../me/me.service';
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

const TEAM_WITH_ROSTER = {
  include: {
    rosters: {
      where: { active: true },
      include: { player: true },
    },
  },
};

const MATCH_DETAIL_INCLUDE = {
  home_team: TEAM_WITH_ROSTER,
  away_team: TEAM_WITH_ROSTER,
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
    private readonly meService: MeService,
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

  async assertCanManageMatch(
    userId: string,
    role: UserRole,
    matchId: string,
  ) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, home_team_id: true, away_team_id: true },
    });
    if (!match) throw new NotFoundException('Match not found');

    const allowed = await this.meService.canAccessMatch(userId, role, match);
    if (!allowed) {
      throw new ForbiddenException('You are not assigned to manage this match');
    }
  }

  async update(
    id: string,
    data: unknown,
    actor?: { userId: string; role: UserRole },
  ) {
    if (actor) await this.assertCanManageMatch(actor.userId, actor.role, id);

    const existing = await this.findOne(id);
    const updateData = data as Prisma.MatchUpdateInput;
    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      include: MATCH_DETAIL_INCLUDE,
    });

    if (updateData.status === 'LIVE' && existing.status !== 'LIVE') {
      await this.gateway.emitMatchStarted(id, match);
      await this.notifyMatchStakeholders(match, 'Match started', `${match.home_team.name} vs ${match.away_team.name} is now live`);
    }

    if (updateData.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      await this.gateway.emitMatchCompleted(id, match.division_id, match);
      await this.notifyMatchStakeholders(
        match,
        'Match completed',
        `Final: ${match.home_team.name} ${match.home_score} – ${match.away_score} ${match.away_team.name}`,
      );
    }

    this.gateway.emitScoreUpdate(id, match.home_score, match.away_score);
    return match;
  }

  async updateScore(
    id: string,
    homeScore: number,
    awayScore: number,
    actor?: { userId: string; role: UserRole },
  ) {
    if (actor) await this.assertCanManageMatch(actor.userId, actor.role, id);

    const match = await prisma.match.update({
      where: { id },
      data: { home_score: homeScore, away_score: awayScore },
      include: MATCH_DETAIL_INCLUDE,
    });

    this.gateway.emitScoreUpdate(id, homeScore, awayScore);
    await this.notifyMatchStakeholders(
      match,
      'Score updated',
      `${match.home_team.name} ${homeScore} – ${awayScore} ${match.away_team.name}`,
    );
    return match;
  }

  async addEvent(
    matchId: string,
    data: unknown,
    actor?: { userId: string; role: UserRole },
  ) {
    if (actor) await this.assertCanManageMatch(actor.userId, actor.role, matchId);

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
    await this.notifyMatchStakeholders(match, `Match event: ${label}`, `${label} at ${eventData.minute}'`);

    return event;
  }

  private async notifyMatchStakeholders(
    match: {
      id: string;
      tournament_id: string;
      division_id: string;
      home_team_id: string;
      away_team_id: string;
      home_team: { name: string };
      away_team: { name: string };
    },
    title: string,
    message: string,
  ) {
    const settings = await this.settingsService.getAdmin();
    if (!settings.live_score_updates && !settings.notifications_enabled) return;

    const userIds = new Set<string>();

    const teamCoaches = await prisma.teamCoach.findMany({
      where: {
        team_id: { in: [match.home_team_id, match.away_team_id] },
        coach: { user_id: { not: null } },
      },
      include: { coach: { select: { user_id: true } } },
    });
    for (const tc of teamCoaches) {
      if (tc.coach.user_id) userIds.add(tc.coach.user_id);
    }

    const matchReferees = await prisma.matchReferee.findMany({
      where: { match_id: match.id },
      include: { referee: { select: { user_id: true } } },
    });
    for (const mr of matchReferees) {
      if (mr.referee.user_id) userIds.add(mr.referee.user_id);
    }

    for (const userId of userIds) {
      const notification = await this.notificationsService.create({
        user_id: userId,
        tournament_id: match.tournament_id,
        title,
        message,
        type: 'MATCH',
      });
      this.gateway.emitNotification(userId, notification);

      if (settings.notifications_enabled) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        if (user?.email) {
          await this.mailService.send({
            to: user.email,
            subject: title,
            text: message,
          });
        }
      }
    }
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
