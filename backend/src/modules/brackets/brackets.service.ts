import { Injectable } from '@nestjs/common';
import type { BracketStage } from '@prisma/client';
import prisma from '../../prisma/prisma';

const STAGES: BracketStage[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'FINAL',
];

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

  async generate(divisionId: string) {
    const standings = await prisma.standing.findMany({
      where: { division_id: divisionId },
      orderBy: { rank: 'asc' },
      take: 8,
    });

    await prisma.bracketNode.deleteMany({ where: { division_id: divisionId } });

    const numTeams = standings.length;
    const stagesNeeded =
      numTeams >= 8
        ? STAGES
        : numTeams >= 4
          ? STAGES.slice(1)
          : STAGES.slice(2);

    const nodes: Array<{
      division_id: string;
      stage: BracketStage;
      position: number;
      home_team_id?: string;
      away_team_id?: string;
    }> = [];

    if (stagesNeeded[0] === 'QUARTER_FINAL') {
      for (let i = 0; i < 4; i++) {
        nodes.push({
          division_id: divisionId,
          stage: 'QUARTER_FINAL',
          position: i,
          home_team_id: standings[i * 2]?.team_id,
          away_team_id: standings[i * 2 + 1]?.team_id,
        });
      }
    }

    nodes.push({ division_id: divisionId, stage: 'SEMI_FINAL', position: 0 });
    nodes.push({ division_id: divisionId, stage: 'SEMI_FINAL', position: 1 });
    nodes.push({ division_id: divisionId, stage: 'FINAL', position: 0 });
    nodes.push({ division_id: divisionId, stage: 'THIRD_PLACE', position: 0 });

    return prisma.$transaction(
      nodes.map((n) => prisma.bracketNode.create({ data: n })),
    );
  }

  advance(nodeId: string, winnerId: string) {
    return prisma.bracketNode.update({
      where: { id: nodeId },
      data: { winner_id: winnerId },
    });
  }
}
