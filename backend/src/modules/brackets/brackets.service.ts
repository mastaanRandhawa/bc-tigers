import { BadRequestException, Injectable } from '@nestjs/common';
import type { BracketStage } from '@prisma/client';
import prisma from '../../prisma/prisma';

const STAGE_ORDER: BracketStage[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'FINAL',
  'THIRD_PLACE',
];

function bracketSizeForTeamCount(count: number): number {
  if (count <= 2) return 2;
  if (count <= 4) return 4;
  if (count <= 8) return 8;
  return 16;
}

function firstStageForSize(size: number): BracketStage {
  if (size >= 16) return 'ROUND_OF_16';
  if (size >= 8) return 'QUARTER_FINAL';
  if (size >= 4) return 'SEMI_FINAL';
  return 'FINAL';
}

function stagesForSize(size: number): BracketStage[] {
  const first = firstStageForSize(size);
  const startIdx = STAGE_ORDER.indexOf(first);
  return STAGE_ORDER.slice(startIdx);
}

function firstRoundMatchCount(size: number): number {
  return size / 2;
}

@Injectable()
export class BracketsService {
  async getByDivision(divisionSlug: string) {
    const division = await prisma.division.findFirst({
      where: { slug: divisionSlug },
    });
    if (!division) return [];
    return this.getByDivisionId(division.id);
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

  private async resolveSeededTeamIds(divisionId: string): Promise<string[]> {
    const standings = await prisma.standing.findMany({
      where: { division_id: divisionId },
      orderBy: [
        { rank: 'asc' },
        { points: 'desc' },
        { goal_difference: 'desc' },
        { goals_for: 'desc' },
      ],
    });

    if (standings.some((s) => s.rank > 0)) {
      return standings
        .filter((s) => s.rank > 0)
        .sort((a, b) => a.rank - b.rank)
        .map((s) => s.team_id);
    }

    if (standings.some((s) => s.points > 0 || s.played > 0)) {
      return standings
        .sort(
          (a, b) =>
            b.points - a.points ||
            b.goal_difference - a.goal_difference ||
            b.goals_for - a.goals_for,
        )
        .map((s) => s.team_id);
    }

    const teams = await prisma.team.findMany({
      where: { division_id: divisionId },
      orderBy: { name: 'asc' },
    });
    return teams.map((t) => t.id);
  }

  async generate(divisionId: string) {
    const division = await prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new BadRequestException('Division not found');

    const teamIds = await this.resolveSeededTeamIds(divisionId);
    if (teamIds.length < 2) {
      throw new BadRequestException('Need at least 2 teams to generate a bracket');
    }

    const size = bracketSizeForTeamCount(teamIds.length);
    const stages = stagesForSize(size);
    const firstStage = stages[0];
    const firstRoundMatches = firstRoundMatchCount(size);

    await prisma.bracketNode.deleteMany({ where: { division_id: divisionId } });

    const nodes: Array<{
      division_id: string;
      stage: BracketStage;
      position: number;
      home_team_id?: string;
      away_team_id?: string;
    }> = [];

    for (let i = 0; i < firstRoundMatches; i++) {
      nodes.push({
        division_id: divisionId,
        stage: firstStage,
        position: i,
        home_team_id: teamIds[i * 2],
        away_team_id: teamIds[i * 2 + 1],
      });
    }

    for (const stage of stages.slice(1)) {
      const count =
        stage === 'SEMI_FINAL' ? 2 : stage === 'QUARTER_FINAL' ? 4 : 1;
      for (let position = 0; position < count; position++) {
        nodes.push({ division_id: divisionId, stage, position });
      }
    }

    return prisma.$transaction(
      nodes.map((n) =>
        prisma.bracketNode.create({
          data: n,
          include: { home_team: true, away_team: true, winner: true },
        }),
      ),
    );
  }

  advance(nodeId: string, winnerId: string) {
    return prisma.bracketNode.update({
      where: { id: nodeId },
      data: { winner_id: winnerId },
      include: { home_team: true, away_team: true, winner: true },
    });
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
}
