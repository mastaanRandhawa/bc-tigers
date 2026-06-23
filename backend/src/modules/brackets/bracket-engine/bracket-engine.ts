import { BadRequestException, Injectable } from '@nestjs/common';
import type { BracketStage } from '@prisma/client';
import prisma from '../../../prisma/prisma';
import type { BracketNodeDraft } from '../scheduling/types';
import {
  BRACKET_NODE_INCLUDE,
  type BracketNodeDetail,
} from './bracket-node.types';
import {
  propagateByes,
  resetDownstreamTeams,
  setWinner,
  type WinnerSource,
} from './progression';
import {
  canEditResults,
  canEditStructure,
  hasPlayedMatches,
  validateBracket,
} from './validation';
import { computeNodeStatus, canSelectWinner } from './status';
import { toEngineNode, type EngineNode } from './types';
import {
  needsProgressionRepair,
  reconcileBracketProgression,
  repairProgressionLinks,
} from './repair';

export type { BracketNodeDetail } from './bracket-node.types';

@Injectable()
export class BracketEngine {
  async loadNodes(divisionId: string): Promise<EngineNode[]> {
    const rows = await prisma.bracketNode.findMany({
      where: { division_id: divisionId },
      include: { match: { select: { status: true } } },
      orderBy: [{ stage: 'asc' }, { position: 'asc' }],
    });
    const nodes = rows.map((r) => toEngineNode(r));

    const linksRepaired = repairProgressionLinks(nodes);
    const shouldReconcile = linksRepaired || needsProgressionRepair(nodes);

    if (shouldReconcile) {
      reconcileBracketProgression(nodes);
      await this.persistAllNodes(nodes);
      return nodes;
    }

    this.recomputeAllStatuses(nodes);
    return nodes;
  }

  /** Load nodes from DB without link repair or BYE reconciliation. */
  async loadNodesRaw(divisionId: string): Promise<EngineNode[]> {
    const rows = await prisma.bracketNode.findMany({
      where: { division_id: divisionId },
      include: { match: { select: { status: true } } },
      orderBy: [{ stage: 'asc' }, { position: 'asc' }],
    });
    const nodes = rows.map((r) => toEngineNode(r));
    this.recomputeAllStatuses(nodes);
    return nodes;
  }

  async loadDivisionFlags(divisionId: string) {
    const division = await prisma.division.findUniqueOrThrow({
      where: { id: divisionId },
      select: { bracket_locked: true, bracket_finalized: true },
    });
    return division;
  }

  async assertStructureEditable(divisionId: string) {
    const flags = await this.loadDivisionFlags(divisionId);
    if (!canEditStructure(flags)) {
      throw new BadRequestException(
        flags.bracket_finalized
          ? 'Bracket is finalized'
          : 'Bracket structure is locked',
      );
    }
  }

  async assertResultsEditable(divisionId: string) {
    const flags = await this.loadDivisionFlags(divisionId);
    if (!canEditResults(flags)) {
      throw new BadRequestException(
        'Bracket is finalized — results cannot be changed',
      );
    }
  }

  isStructureLocked(flags: {
    bracket_locked: boolean;
    bracket_finalized: boolean;
  }): boolean {
    return !canEditStructure(flags);
  }

  async persistNodes(nodes: EngineNode[]): Promise<void> {
    await this.persistAllNodes(nodes);
  }

  async persistAllNodes(nodes: EngineNode[]): Promise<void> {
    await prisma.$transaction(
      nodes.map((n) =>
        prisma.bracketNode.update({
          where: { id: n.id },
          data: {
            home_team_id: n.home_team_id,
            away_team_id: n.away_team_id,
            winner_id: n.winner_id,
            status: n.status,
            auto_advanced: n.auto_advanced,
            completed_at: n.completed_at,
            next_node_id: n.next_node_id,
            next_slot: n.next_slot,
            loser_next_node_id: n.loser_next_node_id,
            loser_next_slot: n.loser_next_slot,
          },
        }),
      ),
    );
  }

  async createNodes(drafts: BracketNodeDraft[]): Promise<void> {
    await prisma.$transaction(
      drafts.map((d) =>
        prisma.bracketNode.create({
          data: {
            id: d.id,
            division_id: d.division_id,
            stage: d.stage,
            position: d.position,
            home_team_id: d.home_team_id ?? null,
            away_team_id: d.away_team_id ?? null,
            next_node_id: d.next_node_id ?? null,
            next_slot: d.next_slot ?? null,
            loser_next_node_id: d.loser_next_node_id ?? null,
            loser_next_slot: d.loser_next_slot ?? null,
            status: 'PENDING',
          },
        }),
      ),
    );
  }

  async runPropagateByes(
    divisionId: string,
    firstStage: BracketStage,
  ): Promise<EngineNode[]> {
    const nodes = await this.loadNodes(divisionId);
    resetDownstreamTeams(nodes, firstStage);
    propagateByes(nodes);
    const validation = validateBracket(nodes);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Bracket validation failed after BYE propagation',
        errors: validation.errors,
      });
    }
    await this.persistNodes(nodes);
    return nodes;
  }

  async applySetWinner(
    nodeId: string,
    winnerId: string,
    source: WinnerSource,
  ): Promise<EngineNode> {
    const node = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
      select: { division_id: true },
    });
    await this.assertResultsEditable(node.division_id);

    const nodes = await this.loadNodes(node.division_id);
    this.recomputeAllStatuses(nodes);
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) throw new BadRequestException('Node not found');

    if (source !== 'bye' && !canSelectWinner(target) && !target.winner_id) {
      throw new BadRequestException('Match is not ready for winner selection');
    }

    setWinner(nodes, nodeId, winnerId, source);
    const validation = validateBracket(nodes);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Bracket validation failed',
        errors: validation.errors,
      });
    }
    await this.persistNodes(nodes);
    return nodes.find((n) => n.id === nodeId)!;
  }

  async finalizeBracket(divisionId: string) {
    const flags = await this.loadDivisionFlags(divisionId);
    if (flags.bracket_finalized) {
      return prisma.division.findUniqueOrThrow({ where: { id: divisionId } });
    }
    const nodes = await this.loadNodes(divisionId);
    const validation = validateBracket(nodes);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Cannot finalize invalid bracket',
        errors: validation.errors,
      });
    }
    return prisma.division.update({
      where: { id: divisionId },
      data: { bracket_finalized: true, bracket_locked: true },
    });
  }

  async unfinalizeBracket(divisionId: string) {
    const nodes = await this.loadNodes(divisionId);
    const played = hasPlayedMatches(nodes);
    return prisma.division.update({
      where: { id: divisionId },
      data: {
        bracket_finalized: false,
        ...(played ? {} : { bracket_locked: false }),
      },
    });
  }

  recomputeAllStatuses(nodes: EngineNode[]): void {
    for (const n of nodes) {
      n.status = computeNodeStatus(n);
    }
  }

  validate(nodes: EngineNode[]) {
    return validateBracket(nodes);
  }

  hasPlayedMatches(nodes: EngineNode[]) {
    return hasPlayedMatches(nodes);
  }

  async getFullBracket(divisionId: string): Promise<BracketNodeDetail[]> {
    const linkSample = await prisma.bracketNode.findMany({
      where: { division_id: divisionId },
      select: {
        id: true,
        stage: true,
        next_node_id: true,
        loser_next_node_id: true,
        position: true,
        home_team_id: true,
        away_team_id: true,
        winner_id: true,
        match_id: true,
        status: true,
        next_slot: true,
        loser_next_slot: true,
        auto_advanced: true,
        completed_at: true,
        division_id: true,
      },
    });
    if (
      linkSample.length > 0 &&
      needsProgressionRepair(linkSample as EngineNode[])
    ) {
      await this.loadNodes(divisionId);
    }

    return prisma.bracketNode.findMany({
      where: { division_id: divisionId },
      include: BRACKET_NODE_INCLUDE,
      orderBy: [{ stage: 'asc' }, { position: 'asc' }],
    });
  }
}

export { propagateByes, setWinner } from './progression';
export {
  validateBracket,
  canEditStructure,
  canEditResults,
  hasPlayedMatches,
} from './validation';
export type { EngineNode } from './types';
