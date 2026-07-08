import { BadRequestException, NotFoundException } from '@nestjs/common';
import prisma from '../prisma/prisma';

export async function assertTournamentEditable(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true, admin_editing_enabled: true, name: true },
  });
  if (!tournament) {
    throw new NotFoundException('Tournament not found');
  }
  if (tournament.status === 'COMPLETED' && !tournament.admin_editing_enabled) {
    throw new BadRequestException(
      `Tournament "${tournament.name}" is completed and locked for viewing. Enable editing to make changes.`,
    );
  }
}

export async function assertDivisionEditable(divisionId: string): Promise<void> {
  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    select: { tournament_id: true },
  });
  if (!division) {
    throw new NotFoundException('Division not found');
  }
  await assertTournamentEditable(division.tournament_id);
}

export async function assertTeamEditable(teamId: string): Promise<void> {
  const memberships = await prisma.teamDivision.findMany({
    where: { team_id: teamId },
    select: { division: { select: { tournament_id: true } } },
  });
  for (const membership of memberships) {
    await assertTournamentEditable(membership.division.tournament_id);
  }
}
