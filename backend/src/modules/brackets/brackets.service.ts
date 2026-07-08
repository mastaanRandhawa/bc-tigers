import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { MatchesGateway } from '../../gateways/matches.gateway';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { BracketStage, MatchSlotOutcome } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { assertDivisionEditable } from '../../common/assert-tournament-editable';
import { MatchesService } from '../matches/matches.service';
import { attachSlotLabels } from '../matches/slot-labels';
import { BracketEngine } from './bracket-engine';
import { replaySavedWinners } from './bracket-engine/repair';
import type { BracketNodeDetail } from './bracket-engine/bracket-node.types';
import {
  planBracket,
  planToNodeDrafts,
  selectEligibleTeams,
  buildFirstRoundSlots,
  shuffleTeamIds,
  bracketSizeForTeamCount,
  type EligibleTeam,
  type BracketNodeDraft,
} from './scheduling';

/** Stage progression order — feeders always sort before the games they feed. */
const STAGE_ORDER: BracketStage[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'FINAL',
  'THIRD_PLACE',
];

@Injectable()
export class BracketsService {
  constructor(
    @Inject(forwardRef(() => MatchesGateway))
    private readonly gateway: MatchesGateway,
    private readonly audit: AuditLogService,
    private readonly engine: BracketEngine,
    @Inject(forwardRef(() => MatchesService))
    private readonly matchesService: MatchesService,
  ) {}

  private emitBracketUpdated(divisionId: string, payload?: unknown) {
    this.gateway.emitBracketUpdated(divisionId, payload ?? { divisionId });
  }

  private async assertEditable(divisionId: string) {
    await assertDivisionEditable(divisionId);
  }

  getByDivisionId(divisionId: string): Promise<BracketNodeDetail[]> {
    return this.engine.getFullBracket(divisionId).then(
      (nodes) =>
        nodes.map((node) =>
          node.match
            ? {
                ...node,
                match: attachSlotLabels(
                  node.match as Parameters<typeof attachSlotLabels>[0],
                ),
              }
            : node,
        ) as BracketNodeDetail[],
    );
  }

  private async loadDivisionTeams(divisionId: string) {
    const memberships = await prisma.teamDivision.findMany({
      where: { division_id: divisionId },
      include: {
        team: {
          include: { players: { select: { id: true, active: true } } },
        },
      },
      orderBy: { team: { name: 'asc' } },
    });
    return memberships.map((m) => ({
      ...m.team,
      slug: m.slug,
      division_id: m.division_id,
    }));
  }

  private async loadEligibleTeams(divisionId: string): Promise<EligibleTeam[]> {
    const teams = await this.loadDivisionTeams(divisionId);

    const { eligible } = selectEligibleTeams({
      divisionId,
      teams,
      minPlayersPerTeam: 0,
    });

    return eligible;
  }

  async validateGeneration(divisionId: string, bracketSize?: number) {
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
    });
    if (!division) throw new BadRequestException('Division not found');

    const flags = await this.engine.loadDivisionFlags(divisionId);
    const structureLocked = this.engine.isStructureLocked(flags);
    const teams = await this.loadDivisionTeams(divisionId);

    const { eligible, validation } = selectEligibleTeams({
      divisionId,
      teams,
      locked: structureLocked,
      minPlayersPerTeam: 0,
      bracketSize,
    });

    const autoSize = bracketSizeForTeamCount(eligible.length);

    return {
      ...validation,
      bracketSize: bracketSize ?? autoSize,
      suggestedBracketSize: autoSize,
      eligibleTeams: eligible.map((t) => ({ id: t.id, name: t.name })),
    };
  }

  /** True when real linked matches are live or completed (not BYE auto-advance). */
  async hasPlayedMatches(divisionId: string): Promise<boolean> {
    const nodes = await this.engine.loadNodes(divisionId);
    return this.engine.hasPlayedMatches(nodes);
  }

  /** Structure edits blocked — does NOT block winner entry. */
  async isStructureLocked(divisionId: string): Promise<boolean> {
    const flags = await this.engine.loadDivisionFlags(divisionId);
    return this.engine.isStructureLocked(flags);
  }

  /** @deprecated Use isStructureLocked — kept for callers expecting isLocked */
  async isLocked(divisionId: string): Promise<boolean> {
    return this.isStructureLocked(divisionId);
  }

  async setBracketLock(divisionId: string, locked: boolean) {
    await this.assertEditable(divisionId);
    const flags = await this.engine.loadDivisionFlags(divisionId);
    if (flags.bracket_finalized) {
      throw new BadRequestException(
        'Cannot change structure lock while bracket is finalized — unfinalize first',
      );
    }
    if (!locked) {
      if (await this.hasPlayedMatches(divisionId)) {
        throw new BadRequestException(
          'Cannot unlock bracket structure — matches have already started',
        );
      }
    }
    return prisma.division
      .update({
        where: { id: divisionId },
        data: { bracket_locked: locked },
      })
      .then((division) => {
        this.emitBracketUpdated(divisionId, { divisionId, locked });
        return division;
      });
  }

  async finalizeBracket(divisionId: string) {
    const division = await this.engine.finalizeBracket(divisionId);
    this.emitBracketUpdated(divisionId, { divisionId, finalized: true });
    return division;
  }

  async unfinalizeBracket(divisionId: string) {
    const division = await this.engine.unfinalizeBracket(divisionId);
    this.emitBracketUpdated(divisionId, { divisionId, finalized: false });
    return division;
  }

  async generate(
    divisionId: string,
    options?: { bracket_size?: number },
  ): Promise<BracketNodeDetail[]> {
    await this.assertEditable(divisionId);
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
      include: { tournament: true },
    });
    if (!division) throw new BadRequestException('Division not found');

    await this.engine.assertStructureEditable(divisionId);

    const eligible = await this.loadEligibleTeams(divisionId);

    const plan = planBracket({
      divisionId,
      teams: eligible,
      bracketSize: options?.bracket_size,
    });

    if (!plan.validation.valid) {
      throw new BadRequestException({
        message: 'Bracket validation failed',
        errors: plan.validation.errors,
        excluded: plan.validation.excluded,
      });
    }

    const nodeDrafts = planToNodeDrafts(plan);

    // Regenerating replaces the whole tree — drop the old nodes and the knockout
    // games we auto-created for them so no orphaned fixtures linger. Round-robin
    // matches are untouched (they were never linked to a bracket node).
    const priorNodes = await prisma.bracketNode.findMany({
      where: { division_id: divisionId, match_id: { not: null } },
      select: { match_id: true },
    });
    const priorMatchIds = priorNodes
      .map((n) => n.match_id)
      .filter((id): id is string => id != null);

    await prisma.bracketNode.deleteMany({ where: { division_id: divisionId } });
    if (priorMatchIds.length > 0) {
      await prisma.match.deleteMany({ where: { id: { in: priorMatchIds } } });
    }

    await this.engine.createNodes(nodeDrafts);
    await this.createNodeMatches(division, nodeDrafts);

    const result = await this.getByDivisionId(divisionId);
    await this.audit.log({
      action: 'BRACKET_GENERATION',
      entity: 'Division',
      entityId: divisionId,
      metadata: { nodes: result.length, matches: nodeDrafts.length },
    });
    this.emitBracketUpdated(divisionId);
    return result;
  }

  /**
   * Create one linked, playable knockout Match per bracket node. First-round
   * games carry the node's placed teams; later rounds carry "Winner/Loser of
   * Game X" source pointers to their feeder games, so scoring a game both
   * advances the bracket and fills the next game's slot (via
   * MatchesService placeholder resolution). Games are numbered after any existing
   * round-robin fixtures so numbering never collides.
   */
  private async createNodeMatches(
    division: {
      id: string;
      tournament_id: string;
      tournament: { start_date: Date };
    },
    drafts: BracketNodeDraft[],
  ) {
    if (drafts.length === 0) return;

    const matchIdByNode = new Map<string, string>();
    for (const d of drafts) matchIdByNode.set(d.id!, crypto.randomUUID());

    // Which feeder game (and which outcome of it) fills each downstream slot.
    type Src = { matchId: string; outcome: 'WINNER' | 'LOSER' };
    const sources = new Map<string, { home?: Src; away?: Src }>();
    const addSource = (nodeId: string, slot: 'home' | 'away', src: Src) => {
      const cur = sources.get(nodeId) ?? {};
      cur[slot] = src;
      sources.set(nodeId, cur);
    };
    for (const f of drafts) {
      const feederMatchId = matchIdByNode.get(f.id!)!;
      if (f.next_node_id && f.next_slot) {
        addSource(f.next_node_id, f.next_slot, {
          matchId: feederMatchId,
          outcome: 'WINNER',
        });
      }
      if (f.loser_next_node_id && f.loser_next_slot) {
        addSource(f.loser_next_node_id, f.loser_next_slot, {
          matchId: feederMatchId,
          outcome: 'LOSER',
        });
      }
    }

    const agg = await prisma.match.aggregate({
      where: { division_id: division.id },
      _max: { round: true },
    });
    let nextRound = (agg._max.round ?? 0) + 1;

    const stageIdx = (s: BracketStage) => STAGE_ORDER.indexOf(s);
    // Create feeders before the games that reference them (FK ordering).
    const ordered = [...drafts].sort(
      (a, b) => stageIdx(a.stage) - stageIdx(b.stage) || a.position - b.position,
    );

    const start = new Date(division.tournament.start_date);

    const matchCreates = ordered.map((d) => {
      const src = sources.get(d.id!) ?? {};
      return prisma.match.create({
        data: {
          id: matchIdByNode.get(d.id!)!,
          tournament_id: division.tournament_id,
          division_id: division.id,
          home_team_id: d.home_team_id ?? null,
          away_team_id: d.away_team_id ?? null,
          home_source_match_id: src.home?.matchId ?? null,
          home_source_outcome: src.home?.outcome ?? null,
          away_source_match_id: src.away?.matchId ?? null,
          away_source_outcome: src.away?.outcome ?? null,
          scheduled_start: start,
          status: 'SCHEDULED',
          match_type: 'Knockout',
          round: nextRound++,
        },
      });
    });

    const nodeLinks = ordered.map((d) =>
      prisma.bracketNode.update({
        where: { id: d.id! },
        data: { match_id: matchIdByNode.get(d.id!)! },
      }),
    );

    await prisma.$transaction([...matchCreates, ...nodeLinks]);
  }

  /**
   * Mirror each node's teams onto its linked knockout Match. The bracket engine
   * is the source of truth for who plays (seeding, BYEs, advancement); this keeps
   * the playable Match rows and their placeholder labels in step after any node
   * change. Teams only — a match's own status/score is never touched here.
   */
  private async syncNodeMatches(divisionId: string) {
    const nodes = await prisma.bracketNode.findMany({
      where: { division_id: divisionId, match_id: { not: null } },
      select: {
        match_id: true,
        home_team_id: true,
        away_team_id: true,
        match: { select: { home_team_id: true, away_team_id: true } },
      },
    });

    const updates = nodes
      .filter(
        (n) =>
          n.match_id != null &&
          (n.home_team_id !== n.match?.home_team_id ||
            n.away_team_id !== n.match?.away_team_id),
      )
      .map((n) =>
        prisma.match.update({
          where: { id: n.match_id! },
          data: {
            home_team_id: n.home_team_id,
            away_team_id: n.away_team_id,
          },
        }),
      );

    if (updates.length > 0) await prisma.$transaction(updates);
  }

  /** Copy resolved team ids from a linked match onto its bracket node. */
  async syncNodeTeamsFromMatch(nodeId: string) {
    const node = await prisma.bracketNode.findUnique({
      where: { id: nodeId },
      include: {
        match: { select: { home_team_id: true, away_team_id: true } },
      },
    });
    if (!node?.match) return;

    if (
      node.home_team_id === node.match.home_team_id &&
      node.away_team_id === node.match.away_team_id
    ) {
      return;
    }

    const nodes = await this.engine.loadNodes(node.division_id);
    const engineNode = nodes.find((n) => n.id === nodeId);
    if (!engineNode) return;

    engineNode.home_team_id = node.match.home_team_id;
    engineNode.away_team_id = node.match.away_team_id;
    if (!node.match.home_team_id || !node.match.away_team_id) {
      engineNode.winner_id = null;
      engineNode.auto_advanced = false;
      engineNode.completed_at = null;
    }

    this.engine.recomputeAllStatuses(nodes);
    await this.engine.persistNodes(nodes);
  }

  async syncNodeTeamsFromMatchByMatchId(matchId: string) {
    const node = await prisma.bracketNode.findFirst({
      where: { match_id: matchId },
      select: { id: true },
    });
    if (node) await this.syncNodeTeamsFromMatch(node.id);
  }

  async randomize(divisionId: string): Promise<BracketNodeDetail[]> {
    await this.assertEditable(divisionId);
    await this.engine.assertStructureEditable(divisionId);

    const nodes = await this.getByDivisionId(divisionId);
    if (nodes.length === 0) {
      await this.generate(divisionId);
      return await this.randomize(divisionId);
    }

    const eligible = await this.loadEligibleTeams(divisionId);
    const firstStage = this.earliestStage(nodes);
    if (!firstStage) throw new BadRequestException('Invalid bracket');

    const firstRound = nodes
      .filter((n) => n.stage === firstStage)
      .sort((a, b) => a.position - b.position);

    const size = firstRound.length * 2;
    const teamIds = shuffleTeamIds(eligible, Date.now());
    const slots = buildFirstRoundSlots(teamIds, size);

    await prisma.$transaction(async (tx) => {
      for (const node of nodes) {
        await tx.bracketNode.update({
          where: { id: node.id },
          data: {
            home_team_id: null,
            away_team_id: null,
            winner_id: null,
            auto_advanced: false,
            completed_at: null,
            status: 'PENDING',
          },
        });
      }

      for (let i = 0; i < firstRound.length; i++) {
        await tx.bracketNode.update({
          where: { id: firstRound[i].id },
          data: {
            home_team_id: slots[i].homeTeamId,
            away_team_id: slots[i].awayTeamId,
            winner_id: null,
            auto_advanced: false,
            completed_at: null,
            status: 'PENDING',
          },
        });
      }
    });

    await this.engine.runPropagateByes(divisionId, firstStage);
    await this.syncNodeMatches(divisionId);
    const result = await this.getByDivisionId(divisionId);
    this.emitBracketUpdated(divisionId);
    return result;
  }

  async placeTeam(nodeId: string, slot: 'home' | 'away', teamId: string) {
    const target = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
    });

    await this.assertEditable(target.division_id);
    await this.engine.assertStructureEditable(target.division_id);

    const nodes = await this.engine.loadNodes(target.division_id);
    const source = nodes.find(
      (n) => n.home_team_id === teamId || n.away_team_id === teamId,
    );
    const sourceSlot = source
      ? source.home_team_id === teamId
        ? 'home'
        : 'away'
      : null;
    const targetNode = nodes.find((n) => n.id === nodeId)!;
    const targetTeamId =
      slot === 'home' ? targetNode.home_team_id : targetNode.away_team_id;

    if (targetNode.winner_id) {
      throw new BadRequestException(
        'Cannot modify a match that already has a winner',
      );
    }
    if (source?.winner_id) {
      throw new BadRequestException('Cannot move a team from a decided match');
    }

    const firstStage = this.earliestStageFromEngine(nodes);
    if (!firstStage) {
      throw new BadRequestException('Invalid bracket');
    }
    if (targetNode.stage !== firstStage) {
      throw new BadRequestException(
        'Teams can only be placed in the first knockout round',
      );
    }
    if (source && source.stage !== firstStage) {
      throw new BadRequestException(
        'Teams in later rounds cannot be moved manually',
      );
    }

    if (source?.id === target.id && sourceSlot && sourceSlot !== slot) {
      const otherId =
        slot === 'home' ? targetNode.away_team_id : targetNode.home_team_id;
      targetNode.home_team_id = slot === 'home' ? teamId : otherId;
      targetNode.away_team_id = slot === 'away' ? teamId : otherId;
      targetNode.winner_id = null;
      targetNode.auto_advanced = false;
      targetNode.completed_at = null;
    } else if (source?.id === target.id && sourceSlot === slot) {
      return this.getNode(nodeId);
    } else if (source && source.id !== target.id) {
      if (sourceSlot === 'home') source.home_team_id = targetTeamId;
      else source.away_team_id = targetTeamId;
      source.winner_id = null;
      if (slot === 'home') targetNode.home_team_id = teamId;
      else targetNode.away_team_id = teamId;
      targetNode.winner_id = null;
    } else {
      if (slot === 'home') targetNode.home_team_id = teamId;
      else targetNode.away_team_id = teamId;
      targetNode.winner_id = null;
    }

    this.engine.recomputeAllStatuses(nodes);
    await this.engine.persistNodes(nodes);

    if (targetNode.match_id) {
      await prisma.match.update({
        where: { id: targetNode.match_id },
        data:
          slot === 'home'
            ? {
                home_source_match_id: null,
                home_source_outcome: null,
                home_source_group_id: null,
                home_source_rank: null,
              }
            : {
                away_source_match_id: null,
                away_source_outcome: null,
                away_source_group_id: null,
                away_source_rank: null,
              },
      });
    }

    await this.syncNodeMatches(target.division_id);
    const result = await this.getNode(nodeId);
    this.emitBracketUpdated(target.division_id);
    return result;
  }

  async placeSlotSource(
    nodeId: string,
    slot: 'home' | 'away',
    sourceMatchId: string,
    outcome: MatchSlotOutcome,
  ) {
    const target = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
    });

    await this.assertEditable(target.division_id);
    await this.engine.assertStructureEditable(target.division_id);

    if (!target.match_id) {
      throw new BadRequestException('Bracket node has no linked match');
    }

    const nodes = await this.engine.loadNodes(target.division_id);
    const targetNode = nodes.find((n) => n.id === nodeId)!;

    if (targetNode.winner_id) {
      throw new BadRequestException(
        'Cannot modify a match that already has a winner',
      );
    }

    const firstStage = this.earliestStageFromEngine(nodes);
    if (!firstStage) {
      throw new BadRequestException('Invalid bracket');
    }
    if (targetNode.stage !== firstStage) {
      throw new BadRequestException(
        'Placeholders can only be set in the first knockout round',
      );
    }

    await prisma.match.update({
      where: { id: target.match_id },
      data:
        slot === 'home'
          ? {
              home_team_id: null,
              home_source_match_id: sourceMatchId,
              home_source_outcome: outcome,
              home_source_group_id: null,
              home_source_rank: null,
            }
          : {
              away_team_id: null,
              away_source_match_id: sourceMatchId,
              away_source_outcome: outcome,
              away_source_group_id: null,
              away_source_rank: null,
            },
    });

    if (slot === 'home') targetNode.home_team_id = null;
    else targetNode.away_team_id = null;
    targetNode.winner_id = null;
    targetNode.auto_advanced = false;
    targetNode.completed_at = null;

    this.engine.recomputeAllStatuses(nodes);
    await this.engine.persistNodes(nodes);
    await this.matchesService.reconcileMatchSlots(target.match_id);
    await this.syncNodeTeamsFromMatch(nodeId);

    const result = await this.getNode(nodeId);
    this.emitBracketUpdated(target.division_id);
    return result;
  }

  /**
   * Record a node's winner and advance. Winners are NOT set by hand from the
   * bracket — the match is the single source of truth, so this only accepts the
   * internal 'match' (a completed match result) and 'bye' (auto-advance) sources.
   */
  async advance(
    nodeId: string,
    winnerId: string,
    source: 'manual' | 'match' | 'bye' = 'manual',
  ) {
    if (source === 'manual') {
      throw new BadRequestException(
        'Winners are recorded by completing the match — set the result on the match and the bracket advances automatically.',
      );
    }
    await this.engine.applySetWinner(nodeId, winnerId, source);
    const node = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
      select: { division_id: true },
    });
    await this.syncNodeMatches(node.division_id);
    const result = await this.getNode(nodeId);
    this.emitBracketUpdated(node.division_id);
    return result;
  }

  /**
   * Un-advance a node whose linked match no longer has a decisive result (it was
   * re-opened or reset). Clears the node's winner and everything downstream, then
   * mirrors the cleared slots back onto the linked matches. Driven by
   * MatchesService — not an admin-facing action.
   */
  async clearNodeWinner(nodeId: string) {
    const result = await this.engine.clearNodeWinner(nodeId);
    const node = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
      select: { division_id: true },
    });
    await this.syncNodeMatches(node.division_id);
    this.emitBracketUpdated(node.division_id);
    return result;
  }

  async updateNode(
    nodeId: string,
    data: {
      home_team_id?: string | null;
      away_team_id?: string | null;
      match_id?: string | null;
    },
  ) {
    const node = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
    });
    await this.assertEditable(node.division_id);
    await this.engine.assertStructureEditable(node.division_id);

    return prisma.bracketNode.update({
      where: { id: nodeId },
      data,
      include: { home_team: true, away_team: true, winner: true },
    });
  }

  private getNode(nodeId: string) {
    return prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
      include: {
        home_team: true,
        away_team: true,
        winner: true,
        match: true,
      },
    });
  }

  async restoreSnapshot(
    divisionId: string,
    snapshot: Array<{
      id: string;
      home_team_id?: string | null;
      away_team_id?: string | null;
      winner_id?: string | null;
    }>,
  ): Promise<BracketNodeDetail[]> {
    await this.assertEditable(divisionId);
    await this.engine.assertStructureEditable(divisionId);

    await prisma.$transaction(
      snapshot.map((s) =>
        prisma.bracketNode.update({
          where: { id: s.id },
          data: {
            home_team_id: s.home_team_id ?? null,
            away_team_id: s.away_team_id ?? null,
            winner_id: s.winner_id ?? null,
            auto_advanced: false,
            completed_at: null,
            status: 'PENDING',
          },
        }),
      ),
    );

    const nodes = await this.engine.loadNodesRaw(divisionId);
    replaySavedWinners(nodes);
    await this.engine.persistNodes(nodes);
    await this.syncNodeMatches(divisionId);

    const result = await this.getByDivisionId(divisionId);
    this.emitBracketUpdated(divisionId);
    return result;
  }

  async swapMatches(
    nodeIdA: string,
    nodeIdB: string,
  ): Promise<BracketNodeDetail[]> {
    if (nodeIdA === nodeIdB) {
      const node = await prisma.bracketNode.findUniqueOrThrow({
        where: { id: nodeIdA },
        select: { division_id: true },
      });
      return this.getByDivisionId(node.division_id);
    }

    const [a, b] = await Promise.all([
      prisma.bracketNode.findUniqueOrThrow({ where: { id: nodeIdA } }),
      prisma.bracketNode.findUniqueOrThrow({ where: { id: nodeIdB } }),
    ]);

    if (a.division_id !== b.division_id || a.stage !== b.stage) {
      throw new BadRequestException(
        'Matches must be in the same round to swap',
      );
    }
    await this.assertEditable(a.division_id);
    await this.engine.assertStructureEditable(a.division_id);
    if (a.winner_id || b.winner_id) {
      throw new BadRequestException(
        'Cannot swap matches that already have a winner',
      );
    }

    // Swap the teams, not the linked games: each node keeps its own match (and
    // thus its schedule, game number and feeder source pointers) — only who plays
    // in that slot moves. syncNodeMatches mirrors the swapped teams onto the two
    // matches below.
    await prisma.$transaction([
      prisma.bracketNode.update({
        where: { id: a.id },
        data: {
          home_team_id: b.home_team_id,
          away_team_id: b.away_team_id,
          winner_id: null,
          auto_advanced: false,
          completed_at: null,
          status: 'PENDING',
        },
      }),
      prisma.bracketNode.update({
        where: { id: b.id },
        data: {
          home_team_id: a.home_team_id,
          away_team_id: a.away_team_id,
          winner_id: null,
          auto_advanced: false,
          completed_at: null,
          status: 'PENDING',
        },
      }),
    ]);

    const firstStage = a.stage;
    await this.engine.runPropagateByes(a.division_id, firstStage);
    await this.syncNodeMatches(a.division_id);
    const result = await this.getByDivisionId(a.division_id);
    this.emitBracketUpdated(a.division_id);
    return result;
  }

  async assignTeamsToFirstRound(
    divisionId: string,
    teamIds: string[],
  ): Promise<BracketNodeDetail[]> {
    await this.assertEditable(divisionId);
    await this.engine.assertStructureEditable(divisionId);

    const nodes = await this.getByDivisionId(divisionId);
    if (nodes.length === 0) {
      throw new BadRequestException('Generate a bracket first');
    }

    const firstStage = this.earliestStage(nodes);
    if (!firstStage) throw new BadRequestException('Invalid bracket');

    const firstRound = nodes
      .filter((n) => n.stage === firstStage)
      .sort((a, b) => a.position - b.position);

    const uniqueTeams = [...new Set(teamIds)];
    const slots: Array<{ nodeId: string; slot: 'home' | 'away' }> = [];
    for (const node of firstRound) {
      if (!node.home_team_id) slots.push({ nodeId: node.id, slot: 'home' });
      if (!node.away_team_id) slots.push({ nodeId: node.id, slot: 'away' });
    }

    const shuffled = shuffleTeamIds(
      uniqueTeams.map((id) => ({
        id,
        name: id,
        slug: id,
        division_id: divisionId,
        playerCount: 1,
      })),
      Date.now(),
    ).slice(0, slots.length);

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < shuffled.length; i++) {
        const { nodeId, slot } = slots[i];
        const node = firstRound.find((n) => n.id === nodeId)!;
        await tx.bracketNode.update({
          where: { id: nodeId },
          data: {
            home_team_id: slot === 'home' ? shuffled[i] : node.home_team_id,
            away_team_id: slot === 'away' ? shuffled[i] : node.away_team_id,
            winner_id: null,
            auto_advanced: false,
            completed_at: null,
            status: 'PENDING',
          },
        });
      }
    });

    await this.engine.runPropagateByes(divisionId, firstStage);
    await this.syncNodeMatches(divisionId);
    const nodesResult = await this.getByDivisionId(divisionId);
    this.emitBracketUpdated(divisionId);
    return nodesResult;
  }

  private earliestStage(
    nodes: Array<{ stage: BracketStage }>,
  ): BracketStage | null {
    const order: BracketStage[] = [
      'ROUND_OF_16',
      'QUARTER_FINAL',
      'SEMI_FINAL',
      'FINAL',
      'THIRD_PLACE',
    ];
    let best: BracketStage | null = null;
    let bestIdx = 99;
    for (const n of nodes) {
      const idx = order.indexOf(n.stage);
      if (idx >= 0 && idx < bestIdx) {
        bestIdx = idx;
        best = n.stage;
      }
    }
    return best;
  }

  private earliestStageFromEngine(
    nodes: Array<{ stage: string }>,
  ): BracketStage | null {
    return this.earliestStage(nodes as Array<{ stage: BracketStage }>);
  }
}
