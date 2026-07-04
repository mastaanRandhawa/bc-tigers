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
import { attachSlotLabels } from './slot-labels';
import {
  isEliminationMatch,
  eliminationMatchIdsForDivision,
  resolveAdvancingTeams,
  getEliminationCompletionError,
  formatMatchResultLine,
  type MatchOutcomeFields,
} from './match-outcome';

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
  'home_source_group_id',
  'home_source_rank',
  'away_source_group_id',
  'away_source_rank',
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
  home_source_group: { select: { id: true, name: true } },
  away_source_group: { select: { id: true, name: true } },
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
  home_source_group: { select: { id: true, name: true } },
  away_source_group: { select: { id: true, name: true } },
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
    const labeled = withSlugs.map(attachSlotLabels);
    return this.withEliminationFlags(labeled);
  }

  private async withEliminationFlag<T extends { id: string; division_id: string }>(
    match: T,
  ): Promise<T & { is_elimination: boolean }> {
    const elimination = await isEliminationMatch(match.id);
    return { ...match, is_elimination: elimination };
  }

  private async withEliminationFlags<T extends { id: string; division_id: string }>(
    matches: T[],
  ): Promise<(T & { is_elimination: boolean })[]> {
    if (matches.length === 0) return [];

    const byDivision = new Map<string, T[]>();
    for (const m of matches) {
      const bucket = byDivision.get(m.division_id) ?? [];
      bucket.push(m);
      byDivision.set(m.division_id, bucket);
    }

    const eliminationByDivision = new Map<string, Set<string>>();
    await Promise.all(
      [...byDivision.keys()].map(async (divisionId) => {
        eliminationByDivision.set(
          divisionId,
          await eliminationMatchIdsForDivision(divisionId),
        );
      }),
    );

    return matches.map((m) => ({
      ...m,
      is_elimination:
        eliminationByDivision.get(m.division_id)?.has(m.id) ?? false,
    }));
  }

  private async assertResultValidForCompletion(
    match: MatchOutcomeFields,
    isElimination: boolean,
  ): Promise<void> {
    const error = getEliminationCompletionError(match, isElimination);
    if (error) throw new BadRequestException(error);
  }

  private async assertResultValidIfCompleted(
    match: MatchOutcomeFields & { status: string },
    isElimination: boolean,
  ): Promise<void> {
    if (match.status !== 'COMPLETED') return;
    await this.assertResultValidForCompletion(match, isElimination);
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
    return this.withEliminationFlag(enriched);
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

    if (updateData.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      await this.assertResultValidForCompletion(
        existing,
        existing.is_elimination,
      );
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
      const scoreLine = formatMatchResultLine(
        match.home_score,
        match.away_score,
        match.home_penalties,
        match.away_penalties,
      );
      await this.emailAdmins(
        match.tournament_id,
        'Match completed',
        `Final: ${matchSideName(match.home_team)} ${scoreLine} ${matchSideName(match.away_team)}`,
      );
      await this.advanceBracketFromMatch(match);
      await this.resolveDependentSlots(match);
      await this.resolvePositionalSlots(match.division_id);
    }

    this.gateway.emitScoreUpdate(id, match.home_score, match.away_score);
    return this.withEliminationFlag(attachSlotLabels(match));
  }

  async updateScore(
    id: string,
    homeScore: number,
    awayScore: number,
    penalties?: {
      home_penalties?: number | null;
      away_penalties?: number | null;
    },
  ) {
    return this.applyResult(id, homeScore, awayScore, penalties);
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

    await this.applyResult(matchId, home, away);
  }

  private async applyResult(
    id: string,
    homeScore: number,
    awayScore: number,
    penalties?: {
      home_penalties?: number | null;
      away_penalties?: number | null;
    },
  ) {
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Match not found');

    const isElimination = await isEliminationMatch(id);
    const tied = homeScore === awayScore;
    const data: Prisma.MatchUncheckedUpdateInput = {
      home_score: homeScore,
      away_score: awayScore,
    };

    if (tied) {
      if (penalties !== undefined) {
        data.home_penalties = penalties.home_penalties ?? null;
        data.away_penalties = penalties.away_penalties ?? null;
      }
    } else {
      data.home_penalties = null;
      data.away_penalties = null;
    }

    const candidate = {
      ...existing,
      home_score: homeScore,
      away_score: awayScore,
      home_penalties: tied
        ? ((data.home_penalties as number | null) ?? existing.home_penalties)
        : null,
      away_penalties: tied
        ? ((data.away_penalties as number | null) ?? existing.away_penalties)
        : null,
    };

    await this.assertResultValidIfCompleted(
      { ...candidate, status: existing.status },
      isElimination,
    );

    const match = await prisma.match.update({
      where: { id },
      data,
      include: MATCH_DETAIL_INCLUDE,
    });

    this.gateway.emitScoreUpdate(id, homeScore, awayScore);

    if (match.status === 'COMPLETED') {
      await this.gateway.refreshStandings(match.division_id);
      await this.resolvePositionalSlots(match.division_id);
      await this.advanceBracketFromMatch(match);
      await this.resolveDependentSlots(match);
    }

    return this.withEliminationFlag(attachSlotLabels(match));
  }

  private async advanceBracketFromMatch(match: MatchOutcomeFields & { division_id: string }) {
    const node = await prisma.bracketNode.findFirst({
      where: { match_id: match.id },
    });
    if (!node) return;

    const outcome = resolveAdvancingTeams(match);
    if (!outcome) return;

    try {
      await this.bracketsService.advance(node.id, outcome.winnerId, 'match');
      this.gateway.emitBracketUpdated(match.division_id, {
        divisionId: match.division_id,
        nodeId: node.id,
        winnerId: outcome.winnerId,
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
    const num = (v: unknown): number | null =>
      typeof v === 'number' ? v : null;
    const sides = [
      {
        label: 'Home',
        teamId: str(payload.home_team_id),
        sourceId: str(payload.home_source_match_id),
        outcome: str(payload.home_source_outcome) as MatchSlotOutcome | null,
        groupId: str(payload.home_source_group_id),
        rank: num(payload.home_source_rank),
      },
      {
        label: 'Away',
        teamId: str(payload.away_team_id),
        sourceId: str(payload.away_source_match_id),
        outcome: str(payload.away_source_outcome) as MatchSlotOutcome | null,
        groupId: str(payload.away_source_group_id),
        rank: num(payload.away_source_rank),
      },
    ];

    for (const side of sides) {
      // A side may be at most one kind of thing: a team, a match-source
      // placeholder, or a standings-position placeholder.
      const kinds = [side.teamId, side.sourceId, side.rank != null].filter(
        Boolean,
      ).length;
      if (kinds > 1) {
        throw new BadRequestException(
          `${side.label} side can only be a team, a match placeholder, or a position — not more than one.`,
        );
      }
      if (side.rank != null) {
        if (side.rank < 1) {
          throw new BadRequestException(
            `${side.label} position rank must be 1 or greater.`,
          );
        }
        if (side.groupId) {
          const group = await prisma.group.findUnique({
            where: { id: side.groupId },
            select: { division_id: true },
          });
          if (!group || group.division_id !== divisionId) {
            throw new BadRequestException(
              `${side.label} position must reference a pool in the same division.`,
            );
          }
        }
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

  /**
   * After a source match completes decisively, fill the team slots of every
   * match that points at it via a Winner/Loser placeholder, then broadcast.
   */
  private async resolveDependentSlots(completed: MatchOutcomeFields & { division_id: string }) {
    const result = resolveAdvancingTeams(completed);
    if (!result) return;

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
   * Fill positional placeholder slots ("Pool A 1st", whole-division "1st") in a
   * division once the pool / division they draw from has finished its
   * round-robin. Runs after standings have been recalculated, so the `Standing`
   * ranks it reads are current. A slot is only filled when every real fixture in
   * its scope is COMPLETED — ranks are not yet final before then.
   */
  private async resolvePositionalSlots(divisionId: string) {
    const pending = await prisma.match.findMany({
      where: {
        division_id: divisionId,
        OR: [
          { home_team_id: null, home_source_rank: { not: null } },
          { away_team_id: null, away_source_rank: { not: null } },
        ],
      },
      select: {
        id: true,
        division_id: true,
        home_team_id: true,
        away_team_id: true,
        home_source_group_id: true,
        home_source_rank: true,
        away_source_group_id: true,
        away_source_rank: true,
      },
    });
    if (pending.length === 0) return;

    for (const m of pending) {
      const data: Prisma.MatchUncheckedUpdateInput = {};
      if (m.home_team_id == null && m.home_source_rank != null) {
        const teamId = await this.resolvePosition(
          divisionId,
          m.home_source_group_id,
          m.home_source_rank,
        );
        if (teamId) data.home_team_id = teamId;
      }
      if (m.away_team_id == null && m.away_source_rank != null) {
        const teamId = await this.resolvePosition(
          divisionId,
          m.away_source_group_id,
          m.away_source_rank,
        );
        if (teamId) data.away_team_id = teamId;
      }
      if (Object.keys(data).length === 0) continue;

      const updated = await prisma.match.update({
        where: { id: m.id },
        data,
        include: MATCH_DETAIL_INCLUDE,
      });
      this.gateway.emitMatchUpdated(
        m.id,
        divisionId,
        attachSlotLabels(updated),
      );
    }
  }

  /**
   * Team currently holding a standings position, or null when the position is
   * not yet decided (the relevant round-robin still has unplayed real fixtures).
   * `groupId` null means a whole-division position.
   */
  private async resolvePosition(
    divisionId: string,
    groupId: string | null,
    rank: number,
  ): Promise<string | null> {
    const remaining = await prisma.match.count({
      where: {
        division_id: divisionId,
        ...(groupId ? { group_id: groupId } : {}),
        // Only count decisive round-robin fixtures (both teams known).
        home_team_id: { not: null },
        away_team_id: { not: null },
        status: { not: 'COMPLETED' },
      },
    });
    if (remaining > 0) return null;

    const standing = await prisma.standing.findFirst({
      where: { division_id: divisionId, group_id: groupId ?? null, rank },
      select: { team_id: true },
    });
    return standing?.team_id ?? null;
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
