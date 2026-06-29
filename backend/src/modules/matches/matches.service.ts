import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import type { Prisma, MatchStatus, MatchSlotOutcome } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { MatchesGateway } from '../../gateways/matches.gateway';
import { BracketsService } from '../brackets/brackets.service';
import { MailService } from '../mail/mail.service';
import { pickAllowed } from '../../common/pick';
import {
  assertCoachCanAddGoalEvent,
  assertCoachCanDeleteGoalEvent,
  assertCoachCanUpdateGoalEvent,
  coachGoalPatchFromUpdate,
} from '../auth/coach-match-goals';
import { assertTeamsInDivision, enrichMatchesWithTeamSlugs, enrichMatchWithTeamSlugs } from '../teams/team-membership';
import {
  canViewTeamRoster,
  getRosterVisibilityContext,
  stripTeamPlayers,
} from '../auth/roster-visibility';

export type MatchEventActor = { userId: string; role: string };

/** Display name for a match side: the team name, else a TBD placeholder. */
function matchSideName(team: { name: string } | null): string {
  return team?.name ?? 'TBD';
}

/** Client-settable scalar fields on a match. Scores are set via the score/events endpoints. */
const MATCH_FIELDS = [
  'tournament_id',
  'division_id',
  'home_team_id',
  'away_team_id',
  'group_id',
  'venue_id',
  'field_id',
  'scheduled_start',
  'scheduled_end',
  'status',
  'round',
  'match_type',
  'stream_url',
  'home_source_match_id',
  'home_source_outcome',
  'away_source_match_id',
  'away_source_outcome',
] as const;

/** Source match shape used to build a placeholder label like "Winner of Game 5". */
const SOURCE_SELECT = {
  select: {
    id: true,
    round: true,
    home_team: { select: { name: true } },
    away_team: { select: { name: true } },
  },
} satisfies Prisma.Match$home_sourceArgs;

/**
 * Human label for an unresolved placeholder slot, e.g. "Winner of Game 5" or,
 * when the source has no game number yet, "Winner of TBD". Returns null when the
 * slot has no source (a real team or a genuinely empty slot).
 */
function slotLabel(
  outcome: MatchSlotOutcome | null,
  source: { round: number | null } | null,
): string | null {
  if (!outcome || !source) return null;
  const verb = outcome === 'WINNER' ? 'Winner' : 'Loser';
  const of = source.round != null ? `Game ${source.round}` : 'TBD';
  return `${verb} of ${of}`;
}

/** Adds `home_label`/`away_label` placeholder text for unresolved slots. */
function attachSlotLabels<
  T extends {
    home_source_outcome: MatchSlotOutcome | null;
    away_source_outcome: MatchSlotOutcome | null;
    home_source?: { round: number | null } | null;
    away_source?: { round: number | null } | null;
    home_team?: unknown;
    away_team?: unknown;
  },
>(match: T): T & { home_label: string | null; away_label: string | null } {
  return {
    ...match,
    home_label: match.home_team
      ? null
      : slotLabel(match.home_source_outcome, match.home_source ?? null),
    away_label: match.away_team
      ? null
      : slotLabel(match.away_source_outcome, match.away_source ?? null),
  };
}

/** Client-settable scalar fields on a match event. `match_id` is set from the route param. */
const MATCH_EVENT_FIELDS = [
  'player_id',
  'team_id',
  'type',
  'minute',
  'extra_time',
] as const;

const MATCH_LIST_INCLUDE = {
  home_team: { select: { id: true, name: true, logo: true } },
  away_team: { select: { id: true, name: true, logo: true } },
  group: { select: { id: true, name: true, slug: true, order: true } },
  venue: { select: { id: true, name: true, slug: true } },
  field: { select: { id: true, name: true } },
  home_source: SOURCE_SELECT,
  away_source: SOURCE_SELECT,
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
  home_source: SOURCE_SELECT,
  away_source: SOURCE_SELECT,
  venue: true,
  field: { select: { id: true, name: true } },
  officials: true,
  events: {
    include: { player: true, team: true },
    orderBy: { minute: 'asc' as const },
  },
  tournament: true,
  division: {
    include: { tournament: { select: { id: true, name: true, slug: true } } },
  },
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

  async findAll(params?: {
    status?: MatchStatus;
    statuses?: MatchStatus[];
    tournamentId?: string;
    divisionId?: string;
    page?: number;
    limit?: number;
    /** Kickoff order — defaults to 'asc' (closest/earliest matches first). */
    order?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 20, order = 'asc' } = params ?? {};
    const where: Prisma.MatchWhereInput = {};
    if (params?.statuses?.length) {
      where.status = { in: params.statuses };
    } else if (params?.status) {
      where.status = params.status;
    }
    if (params?.tournamentId) where.tournament_id = params.tournamentId;
    if (params?.divisionId) where.division_id = params.divisionId;

    const matches = await prisma.match.findMany({
      where,
      include: MATCH_LIST_INCLUDE,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { scheduled_start: order },
    });
    const withSlugs = await enrichMatchesWithTeamSlugs(matches);
    return withSlugs.map(attachSlotLabels);
  }

  async findOne(id: string) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: MATCH_DETAIL_INCLUDE,
    });
    if (!match) throw new NotFoundException('Match not found');

    const ctx = await getRosterVisibilityContext();
    const canViewHome = canViewTeamRoster(
      ctx.actor,
      match.home_team?.coach_user_id ?? null,
      ctx.rostersPublic,
    );
    const canViewAway = canViewTeamRoster(
      ctx.actor,
      match.away_team?.coach_user_id ?? null,
      ctx.rostersPublic,
    );

    const enriched = await enrichMatchWithTeamSlugs(
      attachSlotLabels({
        ...match,
        home_team: match.home_team
          ? stripTeamPlayers(match.home_team, canViewHome)
          : null,
        away_team: match.away_team
          ? stripTeamPlayers(match.away_team, canViewAway)
          : null,
      }),
    );
    return enriched;
  }

  async create(data: unknown) {
    const createData = pickAllowed<Prisma.MatchUncheckedCreateInput>(
      data,
      MATCH_FIELDS,
    );
    await this.validateSources(createData, createData.division_id);
    await assertTeamsInDivision(String(createData.division_id), [
      createData.home_team_id,
      createData.away_team_id,
    ]);

    const match = await prisma.match.create({
      data: createData,
      include: MATCH_DETAIL_INCLUDE,
    });

    // If a chosen source match is already completed, fill the slot right away so
    // a late-added dependent isn't left as a permanent placeholder.
    await this.resolveSlotsFromCompletedSources(match.id);
    return this.findOne(match.id);
  }

  async update(id: string, data: unknown) {
    const existing = await this.findOne(id);
    const updateData = pickAllowed<Prisma.MatchUncheckedUpdateInput>(
      data,
      MATCH_FIELDS,
    );

    await this.validateSources(updateData, existing.division_id, id);
    await assertTeamsInDivision(existing.division_id, [
      updateData.home_team_id as string | null | undefined,
      updateData.away_team_id as string | null | undefined,
    ]);

    // A knockout (bracket-linked) match, or one feeding a Winner/Loser
    // placeholder, cannot end level — advancement needs a decisive winner.
    // Reject the completion up front so the admin enters a result instead of
    // silently stalling the schedule.
    if (updateData.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      if (existing.home_score === existing.away_score) {
        const node = await prisma.bracketNode.findFirst({
          where: { match_id: id },
          select: { id: true },
        });
        const dependentCount = await prisma.match.count({
          where: {
            OR: [{ home_source_match_id: id }, { away_source_match_id: id }],
          },
        });
        if (node || dependentCount > 0) {
          throw new BadRequestException(
            'This match feeds a later fixture and cannot end in a draw — enter a decisive score before completing it.',
          );
        }
      }
    }

    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      include: MATCH_DETAIL_INCLUDE,
    });

    if (updateData.status === 'LIVE' && existing.status !== 'LIVE') {
      this.gateway.emitMatchStarted(id, match);
      await this.emailAdmins(
        match.tournament_id,
        'Match started',
        `${matchSideName(match.home_team)} vs ${matchSideName(match.away_team)} is now live`,
      );
    }

    if (updateData.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      await this.gateway.emitMatchCompleted(id, match.division_id, match);
      await this.emailAdmins(
        match.tournament_id,
        'Match completed',
        `Final: ${matchSideName(match.home_team)} ${match.home_score} – ${match.away_score} ${matchSideName(match.away_team)}`,
      );
      await this.advanceBracketFromMatch(match);
      await this.resolveDependentSlots(match);
    }

    this.gateway.emitScoreUpdate(id, match.home_score, match.away_score);
    return attachSlotLabels(match);
  }

  async updateScore(id: string, homeScore: number, awayScore: number) {
    return this.applyScore(id, homeScore, awayScore);
  }

  async addEvent(matchId: string, data: unknown, actor?: MatchEventActor) {
    const eventData = pickAllowed<Prisma.MatchEventUncheckedCreateInput>(
      data,
      MATCH_EVENT_FIELDS,
    );

    if (actor?.role === 'COACH') {
      await assertCoachCanAddGoalEvent(actor.userId, matchId, eventData);
      eventData.type = 'GOAL';
    }

    const event = await prisma.matchEvent.create({
      data: { ...eventData, match_id: matchId },
      include: { player: true, team: true },
    });

    const match = await this.findOne(matchId);
    await this.syncScoreFromEvents(matchId);

    this.gateway.emitMatchEvent({
      matchId,
      divisionId: match.division_id,
      type: eventData.type,
      data: { matchId, event },
    });

    return event;
  }

  async updateEvent(
    matchId: string,
    eventId: string,
    data: unknown,
    actor?: MatchEventActor,
  ) {
    const existing = await prisma.matchEvent.findFirst({
      where: { id: eventId, match_id: matchId },
    });
    if (!existing) throw new NotFoundException('Match event not found');

    const patch = pickAllowed<Prisma.MatchEventUncheckedUpdateInput>(
      data,
      MATCH_EVENT_FIELDS,
    );

    if (actor?.role === 'COACH') {
      await assertCoachCanUpdateGoalEvent(
        actor.userId,
        matchId,
        existing,
        coachGoalPatchFromUpdate(patch),
      );
      patch.type = 'GOAL';
    }

    const event = await prisma.matchEvent.update({
      where: { id: eventId },
      data: patch,
      include: { player: true, team: true },
    });

    const match = await this.findOne(matchId);
    await this.syncScoreFromEvents(matchId);

    this.gateway.emitMatchEvent({
      matchId,
      divisionId: match.division_id,
      type: event.type,
      data: { matchId, event },
    });

    return event;
  }

  async deleteEvent(matchId: string, eventId: string, actor?: MatchEventActor) {
    const existing = await prisma.matchEvent.findFirst({
      where: { id: eventId, match_id: matchId },
    });
    if (!existing) throw new NotFoundException('Match event not found');

    if (actor?.role === 'COACH') {
      await assertCoachCanDeleteGoalEvent(actor.userId, matchId, existing);
    }

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

    await this.applyScore(matchId, home, away);
  }

  private async applyScore(id: string, homeScore: number, awayScore: number) {
    const match = await prisma.match.update({
      where: { id },
      data: { home_score: homeScore, away_score: awayScore },
      include: MATCH_DETAIL_INCLUDE,
    });

    this.gateway.emitScoreUpdate(id, homeScore, awayScore);

    // Editing the score/events of an already-completed match must keep the
    // standings table in sync — the completion event won't fire again.
    if (match.status === 'COMPLETED') {
      await this.gateway.refreshStandings(match.division_id);
    }

    // Note: no per-score email — admins follow live scores over the socket.
    // Mail is reserved for start/completion transitions (see update()).
    return match;
  }

  private async advanceBracketFromMatch(match: {
    id: string;
    division_id: string;
    home_team_id: string | null;
    away_team_id: string | null;
    home_score: number;
    away_score: number;
  }) {
    const node = await prisma.bracketNode.findFirst({
      where: { match_id: match.id },
    });
    if (!node) return;

    if (match.home_score === match.away_score) {
      this.logger.warn(
        `Match ${match.id} completed as draw — bracket not advanced`,
      );
      return;
    }

    const winnerId =
      match.home_score > match.away_score
        ? match.home_team_id
        : match.away_team_id;
    // Bracket-linked matches always have real teams; guard for type-safety.
    if (!winnerId) return;

    try {
      await this.bracketsService.advance(node.id, winnerId, 'match');
      this.gateway.emitBracketUpdated(match.division_id, {
        divisionId: match.division_id,
        nodeId: node.id,
        winnerId,
      });
    } catch (err) {
      this.logger.error(`Failed to advance bracket for match ${match.id}`, err);
    }
  }

  /**
   * Each side of a match is either a real team OR a placeholder source — never
   * both — and a source must reference another match in the same division (and
   * not itself). Throws BadRequestException on a violation. `payload` is the
   * already-picked create/update data; `selfId` is set on update.
   */
  private async validateSources(
    payload:
      | Prisma.MatchUncheckedCreateInput
      | Prisma.MatchUncheckedUpdateInput,
    divisionId: string,
    selfId?: string,
  ) {
    // pickAllowed copies raw request values, so these are plain scalars at
    // runtime even though the Prisma update type also permits { set } wrappers.
    const str = (v: unknown): string | null =>
      typeof v === 'string' ? v : null;
    const sides = [
      {
        label: 'Home',
        teamId: str(payload.home_team_id),
        sourceId: str(payload.home_source_match_id),
        outcome: str(payload.home_source_outcome) as MatchSlotOutcome | null,
      },
      {
        label: 'Away',
        teamId: str(payload.away_team_id),
        sourceId: str(payload.away_source_match_id),
        outcome: str(payload.away_source_outcome) as MatchSlotOutcome | null,
      },
    ];

    for (const side of sides) {
      if (side.teamId && side.sourceId) {
        throw new BadRequestException(
          `${side.label} side cannot be both a team and a placeholder.`,
        );
      }
      if (side.sourceId) {
        if (!side.outcome) {
          throw new BadRequestException(
            `${side.label} placeholder needs a Winner/Loser selection.`,
          );
        }
        if (side.sourceId === selfId) {
          throw new BadRequestException(
            `${side.label} placeholder cannot reference its own match.`,
          );
        }
        const source = await prisma.match.findUnique({
          where: { id: side.sourceId },
          select: { division_id: true },
        });
        if (!source) {
          throw new BadRequestException(
            `${side.label} placeholder references a match that no longer exists.`,
          );
        }
        if (source.division_id !== divisionId) {
          throw new BadRequestException(
            `${side.label} placeholder must reference a match in the same division.`,
          );
        }
      }
    }
  }

  /** Winner/loser team ids of a decisive match, or null when level/no teams. */
  private decisiveResult(match: {
    home_team_id: string | null;
    away_team_id: string | null;
    home_score: number;
    away_score: number;
  }): { winnerId: string; loserId: string } | null {
    if (match.home_score === match.away_score) return null;
    const homeWon = match.home_score > match.away_score;
    const winnerId = homeWon ? match.home_team_id : match.away_team_id;
    const loserId = homeWon ? match.away_team_id : match.home_team_id;
    if (!winnerId || !loserId) return null;
    return { winnerId, loserId };
  }

  /**
   * After a source match completes decisively, fill the team slots of every
   * match that points at it via a Winner/Loser placeholder, then broadcast.
   */
  private async resolveDependentSlots(completed: {
    id: string;
    division_id: string;
    home_team_id: string | null;
    away_team_id: string | null;
    home_score: number;
    away_score: number;
  }) {
    const result = this.decisiveResult(completed);
    if (!result) {
      this.logger.warn(
        `Match ${completed.id} completed without a decisive result — dependent slots not resolved`,
      );
      return;
    }

    const dependents = await prisma.match.findMany({
      where: {
        OR: [
          { home_source_match_id: completed.id },
          { away_source_match_id: completed.id },
        ],
      },
      select: {
        id: true,
        division_id: true,
        home_source_match_id: true,
        home_source_outcome: true,
        away_source_match_id: true,
        away_source_outcome: true,
      },
    });

    for (const dep of dependents) {
      const data: Prisma.MatchUncheckedUpdateInput = {};
      if (dep.home_source_match_id === completed.id) {
        data.home_team_id =
          dep.home_source_outcome === 'WINNER'
            ? result.winnerId
            : result.loserId;
      }
      if (dep.away_source_match_id === completed.id) {
        data.away_team_id =
          dep.away_source_outcome === 'WINNER'
            ? result.winnerId
            : result.loserId;
      }

      const updated = await prisma.match.update({
        where: { id: dep.id },
        data,
        include: MATCH_DETAIL_INCLUDE,
      });
      this.gateway.emitMatchUpdated(dep.id, dep.division_id, updated);
    }
  }

  /**
   * On create, if a chosen source match is already completed, fill the slot
   * immediately instead of leaving a permanent placeholder.
   */
  private async resolveSlotsFromCompletedSources(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        home_source_match_id: true,
        home_source_outcome: true,
        away_source_match_id: true,
        away_source_outcome: true,
      },
    });
    if (!match) return;

    const sourceIds = [
      match.home_source_match_id,
      match.away_source_match_id,
    ].filter((id): id is string => !!id);
    if (sourceIds.length === 0) return;

    const sources = await prisma.match.findMany({
      where: { id: { in: sourceIds }, status: 'COMPLETED' },
    });
    for (const source of sources) {
      await this.resolveDependentSlots(source);
    }
  }

  private async emailAdmins(
    tournamentId: string,
    title: string,
    message: string,
  ) {
    const admins = await prisma.user.findMany({
      where: { active: true, role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true },
    });

    // Send in parallel and don't let a mail failure (or slow SMTP) block or
    // fail the match mutation that triggered it.
    await Promise.allSettled(
      admins
        .filter((a) => a.email)
        .map((a) =>
          this.mailService.send({ to: a.email, subject: title, text: message }),
        ),
    );
  }

  async remove(id: string) {
    await prisma.bracketNode.updateMany({
      where: { match_id: id },
      data: { match_id: null },
    });
    try {
      return await prisma.match.delete({ where: { id } });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete this match because related data is still linked',
        );
      }
      throw err;
    }
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
