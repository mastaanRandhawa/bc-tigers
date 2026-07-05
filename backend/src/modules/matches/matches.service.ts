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
import {
  assertTeamsInDivision,
  enrichMatchesWithTeamSlugs,
  enrichMatchWithTeamSlugs,
} from '../teams/team-membership';
import {
  canViewTeamRoster,
  getRosterVisibilityContext,
  stripTeamPlayers,
} from '../auth/roster-visibility';
import { attachSlotLabels } from './slot-labels';
import {
  resolveAdvancingTeams,
  getTiedCompletionError,
  formatMatchResultLine,
  standingsExcludedMatchIdsForDivision,
  type MatchOutcomeFields,
} from './match-outcome';
import type { TieResolution } from '@prisma/client';

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
    return withSlugs.map(attachSlotLabels);
  }

  private assertResultValidForCompletion(match: MatchOutcomeFields): void {
    const error = getTiedCompletionError(match);
    if (error) throw new BadRequestException(error);
  }

  private async assertCompletionAllowed(
    match: MatchOutcomeFields & { status?: string },
  ): Promise<void> {
    this.assertResultValidForCompletion(match);
    if (
      match.home_score === match.away_score &&
      match.tie_resolution === 'DRAW'
    ) {
      const node = await prisma.bracketNode.findFirst({
        where: { match_id: match.id },
        select: { id: true },
      });
      if (node) {
        throw new BadRequestException(
          'Elimination matches cannot end in a draw — break the tie with a penalty shootout.',
        );
      }
    }
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
    await this.reconcileOwnSlots(match.id);
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
      await this.assertCompletionAllowed(existing);
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
        match.tie_resolution,
      );
      await this.emailAdmins(
        match.tournament_id,
        'Match completed',
        `Final: ${matchSideName(match.home_team)} ${scoreLine} ${matchSideName(match.away_team)}`,
      );
      await this.resolvePositionalSlots(match.division_id);
    }

    // Keep the bracket and placeholder slots in sync on every edit, not just on
    // completion: the bracket must advance when this match is completed and
    // un-advance when it is re-opened; this match's own slots may have been
    // re-pointed at a different (already finished) source; and any match
    // depending on this one must reflect a changed result or swapped teams.
    await this.syncBracketFromMatch(match);
    await this.reconcileOwnSlots(id);
    await this.reconcileDependentSlots(match);

    this.gateway.emitScoreUpdate(id, match.home_score, match.away_score);
    return attachSlotLabels(match);
  }

  async updateScore(
    id: string,
    homeScore: number,
    awayScore: number,
    options?: {
      home_penalties?: number | null;
      away_penalties?: number | null;
      tie_resolution?: TieResolution | null;
    },
  ) {
    return this.applyResult(id, homeScore, awayScore, options);
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
    options?: {
      home_penalties?: number | null;
      away_penalties?: number | null;
      tie_resolution?: TieResolution | null;
    },
  ) {
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Match not found');

    const tied = homeScore === awayScore;
    const data: Prisma.MatchUncheckedUpdateInput = {
      home_score: homeScore,
      away_score: awayScore,
    };

    if (tied) {
      if (options?.tie_resolution !== undefined) {
        data.tie_resolution = options.tie_resolution;
      }
      const resolution =
        (data.tie_resolution as TieResolution | null | undefined) ??
        existing.tie_resolution;

      if (resolution === 'DRAW') {
        data.home_penalties = null;
        data.away_penalties = null;
      } else if (resolution === 'PENALTIES') {
        if (options?.home_penalties !== undefined) {
          data.home_penalties = options.home_penalties;
        }
        if (options?.away_penalties !== undefined) {
          data.away_penalties = options.away_penalties;
        }
      } else if (options?.home_penalties !== undefined) {
        data.home_penalties = options.home_penalties;
        data.away_penalties = options.away_penalties ?? null;
      }
    } else {
      data.home_penalties = null;
      data.away_penalties = null;
      data.tie_resolution = null;
    }

    const effectiveResolution = tied
      ? ((data.tie_resolution as TieResolution | null | undefined) ??
        existing.tie_resolution)
      : null;

    let effectiveHomePenalties: number | null = null;
    let effectiveAwayPenalties: number | null = null;
    if (tied) {
      if (effectiveResolution === 'DRAW') {
        effectiveHomePenalties = null;
        effectiveAwayPenalties = null;
      } else {
        effectiveHomePenalties =
          (data.home_penalties as number | null | undefined) ??
          existing.home_penalties;
        effectiveAwayPenalties =
          (data.away_penalties as number | null | undefined) ??
          existing.away_penalties;
      }
    }

    const candidate: MatchOutcomeFields & { status: string } = {
      ...existing,
      home_score: homeScore,
      away_score: awayScore,
      home_penalties: effectiveHomePenalties,
      away_penalties: effectiveAwayPenalties,
      tie_resolution: effectiveResolution,
      status: existing.status,
    };

    if (existing.status === 'COMPLETED') {
      await this.assertCompletionAllowed(candidate);
    }

    const match = await prisma.match.update({
      where: { id },
      data,
      include: MATCH_DETAIL_INCLUDE,
    });

    this.gateway.emitScoreUpdate(id, homeScore, awayScore);

    if (match.status === 'COMPLETED') {
      await this.gateway.refreshStandings(match.division_id);
      await this.resolvePositionalSlots(match.division_id);
    }

    // A score edit can flip the winner, decide a shootout, or turn a decided game
    // back into a draw — keep the bracket and every dependent slot in step. Both
    // are no-ops while the game is not yet COMPLETED.
    await this.syncBracketFromMatch(match);
    await this.reconcileDependentSlots(match);

    return attachSlotLabels(match);
  }

  /**
   * Keep the bracket in step with its linked match — the match is the single
   * source of truth. When the match is COMPLETED with a decisive result the node
   * advances (setWinner handles flips by clearing the old downstream first); when
   * the match is re-opened or otherwise no longer decisive, the node's winner and
   * everything downstream are cleared. BYE nodes are engine-managed and left
   * alone. No-op for matches that aren't linked to a bracket node.
   */
  private async syncBracketFromMatch(
    match: MatchOutcomeFields & { division_id: string; status: string },
  ) {
    const node = await prisma.bracketNode.findFirst({
      where: { match_id: match.id },
      select: { id: true, winner_id: true, auto_advanced: true },
    });
    if (!node || node.auto_advanced) return;

    const outcome =
      match.status === 'COMPLETED' ? resolveAdvancingTeams(match) : null;

    try {
      if (outcome) {
        await this.bracketsService.advance(node.id, outcome.winnerId, 'match');
      } else if (node.winner_id) {
        // The match is no longer a decided game — un-advance the bracket.
        await this.bracketsService.clearNodeWinner(node.id);
      }
    } catch (err) {
      this.logger.error(`Failed to sync bracket for match ${match.id}`, err);
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
   * Winner/loser of a source game, but only once that game is actually finished.
   * A slot never resolves off a game that is still SCHEDULED/LIVE/etc. — until
   * then its dependents stay unresolved placeholders.
   */
  private advancingIfComplete(
    source: MatchOutcomeFields & { status: string },
  ): { winnerId: string; loserId: string } | null {
    if (source.status !== 'COMPLETED') return null;
    return resolveAdvancingTeams(source);
  }

  /**
   * Reconcile the team slots of every match that references `source` via a
   * Winner/Loser placeholder. A slot with a source pointer is *always derived*:
   * it holds the winner/loser while the source is a completed, decisive game, and
   * otherwise reverts to null (an unresolved placeholder). This means re-opening,
   * re-scoring to a draw, or clearing a source's teams never leaves a stale team
   * behind. Cascades one dependent at a time into any dependent that is itself a
   * completed source, guarded against cycles. Broadcasts each changed dependent.
   */
  private async reconcileDependentSlots(
    source: MatchOutcomeFields & { division_id: string; status: string },
    visited: Set<string> = new Set(),
  ) {
    if (visited.has(source.id)) return;
    visited.add(source.id);

    const result = this.advancingIfComplete(source);
    const winnerId = result?.winnerId ?? null;
    const loserId = result?.loserId ?? null;

    const dependents = await prisma.match.findMany({
      where: {
        OR: [
          { home_source_match_id: source.id },
          { away_source_match_id: source.id },
        ],
      },
      include: MATCH_DETAIL_INCLUDE,
    });

    for (const dep of dependents) {
      const data: Prisma.MatchUncheckedUpdateInput = {};
      if (dep.home_source_match_id === source.id) {
        const next = dep.home_source_outcome === 'WINNER' ? winnerId : loserId;
        if (next !== dep.home_team_id) data.home_team_id = next;
      }
      if (dep.away_source_match_id === source.id) {
        const next = dep.away_source_outcome === 'WINNER' ? winnerId : loserId;
        if (next !== dep.away_team_id) data.away_team_id = next;
      }
      if (Object.keys(data).length === 0) continue;

      const updated = await prisma.match.update({
        where: { id: dep.id },
        data,
        include: MATCH_DETAIL_INCLUDE,
      });
      this.gateway.emitMatchUpdated(
        dep.id,
        dep.division_id,
        attachSlotLabels(updated),
      );

      // Filling this dependent may change the winner it, in turn, feeds onward.
      if (updated.status === 'COMPLETED') {
        await this.reconcileDependentSlots(updated, visited);
      }
    }
  }

  /**
   * Reconcile a single match's *own* placeholder slots against the current state
   * of the games they point at — used on create and on edit so re-pointing a slot
   * at an already-finished game fills it, and pointing at an unfinished game (or
   * clearing the pointer) leaves/returns it to a placeholder.
   */
  private async reconcileOwnSlots(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        home_team_id: true,
        away_team_id: true,
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
      where: { id: { in: sourceIds } },
    });
    const byId = new Map(sources.map((s) => [s.id, s]));

    const teamFor = (
      sourceId: string | null,
      outcome: MatchSlotOutcome | null,
    ): string | null => {
      if (!sourceId) return null;
      const source = byId.get(sourceId);
      const result = source ? this.advancingIfComplete(source) : null;
      if (!result) return null;
      return outcome === 'WINNER' ? result.winnerId : result.loserId;
    };

    const data: Prisma.MatchUncheckedUpdateInput = {};
    const nextHome = teamFor(
      match.home_source_match_id,
      match.home_source_outcome,
    );
    if (nextHome !== match.home_team_id) data.home_team_id = nextHome;
    const nextAway = teamFor(
      match.away_source_match_id,
      match.away_source_outcome,
    );
    if (nextAway !== match.away_team_id) data.away_team_id = nextAway;

    if (Object.keys(data).length === 0) return;

    const updated = await prisma.match.update({
      where: { id: matchId },
      data,
      include: MATCH_DETAIL_INCLUDE,
    });
    this.gateway.emitMatchUpdated(
      matchId,
      updated.division_id,
      attachSlotLabels(updated),
    );
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

    const excludedMatchIds =
      await standingsExcludedMatchIdsForDivision(divisionId);

    for (const m of pending) {
      const data: Prisma.MatchUncheckedUpdateInput = {};
      if (m.home_team_id == null && m.home_source_rank != null) {
        const teamId = await this.resolvePosition(
          divisionId,
          m.home_source_group_id,
          m.home_source_rank,
          excludedMatchIds,
        );
        if (teamId) data.home_team_id = teamId;
      }
      if (m.away_team_id == null && m.away_source_rank != null) {
        const teamId = await this.resolvePosition(
          divisionId,
          m.away_source_group_id,
          m.away_source_rank,
          excludedMatchIds,
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
    excludedMatchIds: Set<string>,
  ): Promise<string | null> {
    const excluded = [...excludedMatchIds];
    const remaining = await prisma.match.count({
      where: {
        division_id: divisionId,
        ...(groupId ? { group_id: groupId } : {}),
        ...(excluded.length > 0 ? { id: { notIn: excluded } } : {}),
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
    const existing = await prisma.match.findUnique({
      where: { id },
      select: { status: true, division_id: true },
    });
    if (!existing) throw new NotFoundException('Match not found');

    await prisma.bracketNode.updateMany({
      where: { match_id: id },
      data: { match_id: null },
    });
    try {
      const deleted = await prisma.match.delete({ where: { id } });
      if (existing.status === 'COMPLETED') {
        await this.gateway.refreshStandings(existing.division_id);
      }
      return deleted;
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
