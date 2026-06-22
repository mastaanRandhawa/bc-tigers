import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { MatchesGateway } from '../../gateways/matches.gateway';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { BracketStage } from '@prisma/client';
import prisma from '../../prisma/prisma';
import type { BracketSeeding } from './bracket-seeding';
import {
  planBracket,
  planToNodeDrafts,
  nextBracketSlot,
  selectEligibleTeams,
  buildFirstRoundSlots,
  orderTeamsBySeeding,
  type EligibleTeam,
} from './scheduling';

@Injectable()
export class BracketsService {
  constructor(
    @Inject(forwardRef(() => MatchesGateway))
    private readonly gateway: MatchesGateway,
    private readonly audit: AuditLogService,
  ) {}

  private emitBracketUpdated(divisionId: string, payload?: unknown) {
    this.gateway.emitBracketUpdated(divisionId, payload ?? { divisionId });
  }

  getByDivisionId(divisionId: string) {
    return prisma.bracketNode.findMany({
      where: { division_id: divisionId },
      include: {
        home_team: true,
        away_team: true,
        winner: true,
        match: { include: { home_team: true, away_team: true } },
      },
      orderBy: [{ stage: 'asc' }, { position: 'asc' }],
    });
  }

  private async loadEligibleTeams(divisionId: string): Promise<{
    eligible: EligibleTeam[];
    rankedTeamIds: string[];
  }> {
    const teams = await prisma.team.findMany({
      where: { division_id: divisionId },
      include: { players: { select: { id: true, active: true } } },
      orderBy: { name: 'asc' },
    });

    const standings = await prisma.standing.findMany({
      where: { division_id: divisionId },
    });
    const standingByTeam = new Map(standings.map((s) => [s.team_id, s]));

    const rankedTeamIds = [...teams]
      .sort((a, b) => {
        const sa = standingByTeam.get(a.id);
        const sb = standingByTeam.get(b.id);
        const rankA = sa?.rank && sa.rank > 0 ? sa.rank : Number.MAX_SAFE_INTEGER;
        const rankB = sb?.rank && sb.rank > 0 ? sb.rank : Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB) return rankA - rankB;
        const pointsDiff = (sb?.points ?? 0) - (sa?.points ?? 0);
        if (pointsDiff !== 0) return pointsDiff;
        return a.name.localeCompare(b.name);
      })
      .map((t) => t.id);

    const { eligible } = selectEligibleTeams({
      divisionId,
      teams,
      seeding: 'standard',
      minPlayersPerTeam: 0,
    });

    return { eligible, rankedTeamIds };
  }

  async validateGeneration(divisionId: string, seeding: BracketSeeding = 'standard') {
    const division = await prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new BadRequestException('Division not found');

    const locked = await this.isLocked(divisionId);
    const teams = await prisma.team.findMany({
      where: { division_id: divisionId },
      include: { players: { select: { id: true, active: true } } },
    });

    const { eligible, validation } = selectEligibleTeams({
      divisionId,
      teams,
      seeding,
      locked,
      minPlayersPerTeam: 0,
    });

    return { ...validation, eligibleTeams: eligible.map((t) => ({ id: t.id, name: t.name })) };
  }

  async hasMatchActivity(divisionId: string): Promise<boolean> {
    const nodes = await prisma.bracketNode.findMany({
      where: { division_id: divisionId },
      select: { winner_id: true, match: { select: { status: true } } },
    });
    return nodes.some(
      (n) =>
        !!n.winner_id ||
        n.match?.status === 'LIVE' ||
        n.match?.status === 'COMPLETED',
    );
  }

  async isLocked(divisionId: string): Promise<boolean> {
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
      select: { bracket_locked: true },
    });
    if (division?.bracket_locked) return true;
    return this.hasMatchActivity(divisionId);
  }

  async setBracketLock(divisionId: string, locked: boolean) {
    if (!locked && (await this.hasMatchActivity(divisionId))) {
      throw new BadRequestException(
        'Cannot unlock bracket structure — matches have already started',
      );
    }
    return prisma.division.update({
      where: { id: divisionId },
      data: { bracket_locked: locked },
    }).then((division) => {
      this.emitBracketUpdated(divisionId, { divisionId, locked });
      return division;
    });
  }

  private async applyByeAdvances(divisionId: string, firstStage: BracketStage) {
    const allNodes = await prisma.bracketNode.findMany({
      where: { division_id: divisionId },
      orderBy: [{ stage: 'asc' }, { position: 'asc' }],
    });

    const firstRound = allNodes.filter((n) => n.stage === firstStage);

    await prisma.$transaction(async (tx) => {
      // Clear downstream slots before propagating bye winners
      for (const node of allNodes) {
        if (node.stage === firstStage) continue;
        await tx.bracketNode.update({
          where: { id: node.id },
          data: {
            home_team_id: null,
            away_team_id: null,
            winner_id: null,
          },
        });
      }

      for (const node of firstRound) {
        await tx.bracketNode.update({
          where: { id: node.id },
          data: { winner_id: null },
        });
      }

      for (const node of firstRound) {
        const home = node.home_team_id;
        const away = node.away_team_id;
        const winnerId =
          home && !away ? home : away && !home ? away : null;
        if (!winnerId) continue;

        await tx.bracketNode.update({
          where: { id: node.id },
          data: { winner_id: winnerId },
        });

        const next = nextBracketSlot(node.stage, node.position);
        if (!next) continue;

        const existing = await tx.bracketNode.findUnique({
          where: {
            division_id_stage_position: {
              division_id: divisionId,
              stage: next.stage,
              position: next.position,
            },
          },
        });
        if (!existing) continue;

        await tx.bracketNode.update({
          where: { id: existing.id },
          data:
            next.slot === 'home'
              ? { home_team_id: winnerId }
              : { away_team_id: winnerId },
        });
      }
    });
  }

  async generate(
    divisionId: string,
    options?: { seeding?: BracketSeeding; randomSeed?: number },
  ) {
    const division = await prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new BadRequestException('Division not found');

    if (await this.isLocked(divisionId)) {
      throw new BadRequestException(
        'Bracket is locked — unlock before regenerating or reset match results first',
      );
    }

    const { eligible, rankedTeamIds } = await this.loadEligibleTeams(divisionId);
    const seeding = options?.seeding ?? 'standard';

    const plan = planBracket({
      divisionId,
      teams: eligible,
      seeding,
      rankedTeamIds,
      randomSeed: options?.randomSeed,
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

    await prisma.$transaction(async (tx) => {
      for (const n of nodeDrafts) {
        await tx.bracketNode.create({ data: n });
      }
    });

    if (seeding !== 'manual') {
      await this.applyByeAdvances(divisionId, plan.firstStage);
    }

    const result = await this.getByDivisionId(divisionId);
    await this.audit.log({
      action: 'BRACKET_GENERATION',
      entity: 'Division',
      entityId: divisionId,
      metadata: { seeding: seeding ?? 'standard', nodes: result.length },
    });
    this.emitBracketUpdated(divisionId);
    return result;
  }

  async randomize(divisionId: string) {
    if (await this.isLocked(divisionId)) {
      throw new BadRequestException('Bracket is locked after matches have started');
    }

    const nodes = await this.getByDivisionId(divisionId);
    if (nodes.length === 0) {
      return this.generate(divisionId, { seeding: 'random' });
    }

    const { eligible } = await this.loadEligibleTeams(divisionId);
    const firstStage = nodes.reduce<BracketStage | null>((earliest, n) => {
      const order: BracketStage[] = [
        'ROUND_OF_16',
        'QUARTER_FINAL',
        'SEMI_FINAL',
        'FINAL',
        'THIRD_PLACE',
      ];
      const idx = order.indexOf(n.stage);
      const cur = earliest ? order.indexOf(earliest) : 99;
      return idx >= 0 && idx < cur ? n.stage : earliest;
    }, null);

    if (!firstStage) throw new BadRequestException('Invalid bracket');

    const firstRound = nodes
      .filter((n) => n.stage === firstStage)
      .sort((a, b) => a.position - b.position);

    const size = firstRound.length * 2;
    const teamIds = orderTeamsBySeeding(eligible, 'random', {
      randomSeed: Date.now(),
    });
    const slots = buildFirstRoundSlots(teamIds, size);

    await prisma.$transaction(async (tx) => {
      for (const node of nodes) {
        await tx.bracketNode.update({
          where: { id: node.id },
          data: {
            home_team_id: null,
            away_team_id: null,
            winner_id: null,
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
          },
        });
      }
    });

    await this.applyByeAdvances(divisionId, firstStage);
    const result = await this.getByDivisionId(divisionId);
    this.emitBracketUpdated(divisionId);
    return result;
  }

  async placeTeam(nodeId: string, slot: 'home' | 'away', teamId: string) {
    const target = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
    });

    if (await this.isLocked(target.division_id)) {
      throw new BadRequestException('Bracket is locked after matches have started');
    }

    const nodes = await prisma.bracketNode.findMany({
      where: { division_id: target.division_id },
    });

    const source = nodes.find(
      (n) => n.home_team_id === teamId || n.away_team_id === teamId,
    );
    const sourceSlot = source
      ? source.home_team_id === teamId
        ? 'home'
        : 'away'
      : null;
    const targetTeamId = slot === 'home' ? target.home_team_id : target.away_team_id;

    if (source?.id === target.id && sourceSlot && sourceSlot !== slot) {
      const otherId = slot === 'home' ? target.away_team_id : target.home_team_id;
      await prisma.bracketNode.update({
        where: { id: target.id },
        data: {
          home_team_id: slot === 'home' ? teamId : otherId,
          away_team_id: slot === 'away' ? teamId : otherId,
          winner_id: null,
        },
      });
      return this.getNode(nodeId);
    }

    if (source?.id === target.id && sourceSlot === slot) {
      return this.getNode(nodeId);
    }

    const updates: Array<{ id: string; home_team_id: string | null; away_team_id: string | null }> = [];

    if (source && source.id !== target.id) {
      const sourcePatch = {
        id: source.id,
        home_team_id: source.home_team_id,
        away_team_id: source.away_team_id,
      };
      const targetPatch = {
        id: target.id,
        home_team_id: target.home_team_id,
        away_team_id: target.away_team_id,
      };

      if (sourceSlot === 'home') sourcePatch.home_team_id = targetTeamId;
      else sourcePatch.away_team_id = targetTeamId;

      if (slot === 'home') targetPatch.home_team_id = teamId;
      else targetPatch.away_team_id = teamId;

      updates.push(sourcePatch, targetPatch);
    } else {
      const targetPatch = {
        id: target.id,
        home_team_id: target.home_team_id,
        away_team_id: target.away_team_id,
      };
      if (slot === 'home') targetPatch.home_team_id = teamId;
      else targetPatch.away_team_id = teamId;
      updates.push(targetPatch);
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.bracketNode.update({
          where: { id: u.id },
          data: {
            home_team_id: u.home_team_id,
            away_team_id: u.away_team_id,
            winner_id: null,
          },
        }),
      ),
    );

    const result = await this.getNode(nodeId);
    this.emitBracketUpdated(target.division_id);
    return result;
  }

  async advance(nodeId: string, winnerId: string, fromBye = false) {
    const node = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
      include: { match: true },
    });

    if (!fromBye && (await this.isLocked(node.division_id)) && node.winner_id) {
      throw new BadRequestException('Bracket is locked after matches have started');
    }

    if (node.home_team_id && node.away_team_id) {
      if (winnerId !== node.home_team_id && winnerId !== node.away_team_id) {
        throw new BadRequestException('Winner must be a participating team');
      }
    } else if (node.home_team_id) {
      if (winnerId !== node.home_team_id) {
        throw new BadRequestException('Invalid bye advance');
      }
    } else if (node.away_team_id) {
      if (winnerId !== node.away_team_id) {
        throw new BadRequestException('Invalid bye advance');
      }
    }

    await prisma.bracketNode.update({
      where: { id: nodeId },
      data: { winner_id: winnerId },
    });

    const next = nextBracketSlot(node.stage, node.position);
    if (next) {
      const existing = await prisma.bracketNode.findUnique({
        where: {
          division_id_stage_position: {
            division_id: node.division_id,
            stage: next.stage,
            position: next.position,
          },
        },
      });
      if (existing) {
        await prisma.bracketNode.update({
          where: { id: existing.id },
          data:
            next.slot === 'home'
              ? { home_team_id: winnerId }
              : { away_team_id: winnerId },
        });
      }
    }

    const result = await this.getNode(nodeId);
    this.emitBracketUpdated(node.division_id);
    return result;
  }

  updateNode(
    nodeId: string,
    data: {
      home_team_id?: string | null;
      away_team_id?: string | null;
      match_id?: string | null;
    },
  ) {
    return prisma.bracketNode.update({
      where: { id: nodeId },
      data,
      include: { home_team: true, away_team: true, winner: true },
    });
  }

  private getNode(nodeId: string) {
    return prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
      include: { home_team: true, away_team: true, winner: true, match: true },
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
    if (await this.isLocked(divisionId)) {
      throw new BadRequestException('Bracket is locked after matches have started');
    }

    await prisma.$transaction(
      snapshot.map((s) =>
        prisma.bracketNode.update({
          where: { id: s.id },
          data: {
            home_team_id: s.home_team_id ?? null,
            away_team_id: s.away_team_id ?? null,
            winner_id: s.winner_id ?? null,
          },
        }),
      ),
    );

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
    if (await this.isLocked(a.division_id)) {
      throw new BadRequestException('Bracket is locked');
    }
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
        },
      }),
      prisma.bracketNode.update({
        where: { id: b.id },
        data: {
          home_team_id: a.home_team_id,
          away_team_id: a.away_team_id,
          winner_id: null,
          match_id: a.match_id,
        },
      }),
    ]);

    const result = await this.getByDivisionId(a.division_id);
    this.emitBracketUpdated(a.division_id);
    return result;
  }

  async assignTeamsToFirstRound(divisionId: string, teamIds: string[]) {
    if (await this.isLocked(divisionId)) {
      throw new BadRequestException('Bracket is locked');
    }

    const nodes = await this.getByDivisionId(divisionId);
    if (nodes.length === 0) {
      throw new BadRequestException('Generate a bracket first');
    }

    const firstStage = nodes.reduce<BracketStage | null>((earliest, n) => {
      const order: BracketStage[] = [
        'ROUND_OF_16',
        'QUARTER_FINAL',
        'SEMI_FINAL',
        'FINAL',
        'THIRD_PLACE',
      ];
      const idx = order.indexOf(n.stage);
      const cur = earliest ? order.indexOf(earliest) : 99;
      return idx >= 0 && idx < cur ? n.stage : earliest;
    }, null);

    if (!firstStage) throw new BadRequestException('Invalid bracket');

    const firstRound = nodes
      .filter((n) => n.stage === firstStage)
      .sort((a, b) => a.position - b.position);

    const size = firstRound.length * 2;
    const uniqueTeams = [...new Set(teamIds)];

    const slots: Array<{ nodeId: string; slot: 'home' | 'away' }> = [];
    for (const node of firstRound) {
      if (!node.home_team_id) slots.push({ nodeId: node.id, slot: 'home' });
      if (!node.away_team_id) slots.push({ nodeId: node.id, slot: 'away' });
    }

    const shuffled = orderTeamsBySeeding(
      uniqueTeams.map((id) => ({
        id,
        name: id,
        slug: id,
        division_id: divisionId,
        playerCount: 1,
      })),
      'random',
      { randomSeed: Date.now() },
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
          },
        });
      }
    });

    await this.applyByeAdvances(divisionId, firstStage);
    const nodesResult = await this.getByDivisionId(divisionId);
    this.emitBracketUpdated(divisionId);
    return nodesResult;
  }
}
