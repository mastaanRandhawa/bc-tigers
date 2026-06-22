import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { MatchesGateway } from '../../gateways/matches.gateway';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { BracketStage } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { BracketEngine } from './bracket-engine';
import {
  planBracket,
  planToNodeDrafts,
  selectEligibleTeams,
  buildFirstRoundSlots,
  shuffleTeamIds,
  firstStageForSize,
  type EligibleTeam,
} from './scheduling';

@Injectable()
export class BracketsService {
  constructor(
    @Inject(forwardRef(() => MatchesGateway))
    private readonly gateway: MatchesGateway,
    private readonly audit: AuditLogService,
    private readonly engine: BracketEngine,
  ) {}

  private emitBracketUpdated(divisionId: string, payload?: unknown) {
    this.gateway.emitBracketUpdated(divisionId, payload ?? { divisionId });
  }

  getByDivisionId(divisionId: string) {
    return this.engine.getFullBracket(divisionId);
  }

  private async loadEligibleTeams(divisionId: string): Promise<EligibleTeam[]> {
    const teams = await prisma.team.findMany({
      where: { division_id: divisionId },
      include: { players: { select: { id: true, active: true } } },
      orderBy: { name: 'asc' },
    });

    const { eligible } = selectEligibleTeams({
      divisionId,
      teams,
      minPlayersPerTeam: 0,
    });

    return eligible;
  }

  async validateGeneration(divisionId: string) {
    const division = await prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new BadRequestException('Division not found');

    const flags = await this.engine.loadDivisionFlags(divisionId);
    const structureLocked = this.engine.isStructureLocked(flags);
    const teams = await prisma.team.findMany({
      where: { division_id: divisionId },
      include: { players: { select: { id: true, active: true } } },
    });

    const { eligible, validation } = selectEligibleTeams({
      divisionId,
      teams,
      locked: structureLocked,
      minPlayersPerTeam: 0,
    });

    return { ...validation, eligibleTeams: eligible.map((t) => ({ id: t.id, name: t.name })) };
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

  async generate(divisionId: string) {
    const division = await prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new BadRequestException('Division not found');

    await this.engine.assertStructureEditable(divisionId);

    const eligible = await this.loadEligibleTeams(divisionId);

    const plan = planBracket({
      divisionId,
      teams: eligible,
    });

    if (!plan.validation.valid) {
      throw new BadRequestException({
        message: 'Bracket validation failed',
        errors: plan.validation.errors,
        excluded: plan.validation.excluded,
      });
    }

    const nodeDrafts = planToNodeDrafts(plan);
    await prisma.bracketNode.deleteMany({ where: { division_id: divisionId } });
    await this.engine.createNodes(nodeDrafts);

    const result = await this.getByDivisionId(divisionId);
    await this.audit.log({
      action: 'BRACKET_GENERATION',
      entity: 'Division',
      entityId: divisionId,
      metadata: { nodes: result.length },
    });
    this.emitBracketUpdated(divisionId);
    return result;
  }

  async randomize(divisionId: string) {
    await this.engine.assertStructureEditable(divisionId);

    const nodes = await this.getByDivisionId(divisionId);
    if (nodes.length === 0) {
      await this.generate(divisionId);
      return this.randomize(divisionId);
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
    const result = await this.getByDivisionId(divisionId);
    this.emitBracketUpdated(divisionId);
    return result;
  }

  async placeTeam(nodeId: string, slot: 'home' | 'away', teamId: string) {
    const target = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
    });

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
    const targetTeamId = slot === 'home' ? targetNode.home_team_id : targetNode.away_team_id;

    if (targetNode.winner_id) {
      throw new BadRequestException('Cannot modify a match that already has a winner');
    }
    if (source?.winner_id) {
      throw new BadRequestException('Cannot move a team from a decided match');
    }

    const firstStage = this.earliestStageFromEngine(nodes);
    if (!firstStage) {
      throw new BadRequestException('Invalid bracket');
    }
    if (targetNode.stage !== firstStage) {
      throw new BadRequestException('Teams can only be placed in the first knockout round');
    }
    if (source && source.stage !== firstStage) {
      throw new BadRequestException('Teams in later rounds cannot be moved manually');
    }

    if (source?.id === target.id && sourceSlot && sourceSlot !== slot) {
      const otherId = slot === 'home' ? targetNode.away_team_id : targetNode.home_team_id;
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
    const result = await this.getNode(nodeId);
    this.emitBracketUpdated(target.division_id);
    return result;
  }

  async advance(
    nodeId: string,
    winnerId: string,
    source: 'manual' | 'match' | 'bye' = 'manual',
  ) {
    await this.engine.applySetWinner(nodeId, winnerId, source);
    const node = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
      select: { division_id: true },
    });
    const result = await this.getNode(nodeId);
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
  ) {
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

    const nodes = await this.engine.loadNodes(divisionId);
    const firstStage = this.earliestStageFromEngine(nodes);
    if (firstStage) {
      await this.engine.runPropagateByes(divisionId, firstStage as BracketStage);
    }

    const result = await this.getByDivisionId(divisionId);
    this.emitBracketUpdated(divisionId);
    return result;
  }

  async swapMatches(nodeIdA: string, nodeIdB: string) {
    if (nodeIdA === nodeIdB) return this.getNode(nodeIdA);

    const [a, b] = await Promise.all([
      prisma.bracketNode.findUniqueOrThrow({ where: { id: nodeIdA } }),
      prisma.bracketNode.findUniqueOrThrow({ where: { id: nodeIdB } }),
    ]);

    if (a.division_id !== b.division_id || a.stage !== b.stage) {
      throw new BadRequestException('Matches must be in the same round to swap');
    }
    await this.engine.assertStructureEditable(a.division_id);
    if (a.winner_id || b.winner_id) {
      throw new BadRequestException('Cannot swap matches that already have a winner');
    }

    await prisma.$transaction([
      prisma.bracketNode.update({
        where: { id: a.id },
        data: {
          home_team_id: b.home_team_id,
          away_team_id: b.away_team_id,
          winner_id: null,
          match_id: b.match_id,
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
          match_id: a.match_id,
          auto_advanced: false,
          completed_at: null,
          status: 'PENDING',
        },
      }),
    ]);

    const firstStage = a.stage;
    await this.engine.runPropagateByes(a.division_id, firstStage);
    const result = await this.getByDivisionId(a.division_id);
    this.emitBracketUpdated(a.division_id);
    return result;
  }

  async assignTeamsToFirstRound(divisionId: string, teamIds: string[]) {
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
