import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Group, Prisma, Team, TeamDivision } from '@prisma/client';
import prisma from '../../prisma/prisma';

export type TeamWithMemberships = Team & {
  divisions: (TeamDivision & {
    division?: { id: string; name: string; slug: string; tournament_id: string };
    group?: Pick<Group, 'id' | 'name' | 'slug' | 'order'> | null;
  })[];
};

/** Division-scoped team shape returned by public/admin APIs (backward compatible). */
export type TeamInDivision = Team & {
  division_id: string;
  group_id: string | null;
  slug: string;
  division?: TeamWithMemberships['divisions'][0]['division'];
  group?: Pick<Group, 'id' | 'name' | 'slug' | 'order'> | null;
  /** All divisions this team belongs to. */
  division_ids?: string[];
  divisions?: TeamWithMemberships['divisions'];
};

const MEMBERSHIP_INCLUDE = {
  division: {
    select: {
      id: true,
      name: true,
      slug: true,
      tournament_id: true,
      tournament: { select: { id: true, name: true, slug: true } },
    },
  },
  group: { select: { id: true, name: true, slug: true, order: true } },
} satisfies Prisma.TeamDivisionInclude;

const TEAM_DETAIL_INCLUDE = {
  coach: {
    select: { id: true, first_name: true, last_name: true, email: true },
  },
  divisions: { include: MEMBERSHIP_INCLUDE },
} satisfies Prisma.TeamInclude;

export function flattenTeamForDivision(
  team: TeamWithMemberships,
  divisionId: string,
): TeamInDivision {
  const membership = team.divisions.find((d) => d.division_id === divisionId);
  if (!membership) {
    throw new NotFoundException('Team is not registered in this division');
  }
  return {
    ...team,
    division_id: membership.division_id,
    group_id: membership.group_id,
    slug: membership.slug,
    division: membership.division,
    group: membership.group,
    division_ids: team.divisions.map((d) => d.division_id),
  };
}

export function flattenMembershipRow(
  membership: TeamDivision & {
    team: TeamWithMemberships;
    division?: TeamWithMemberships['divisions'][0]['division'];
    group?: TeamWithMemberships['divisions'][0]['group'];
  },
): TeamInDivision {
  const { team, ...rest } = membership;
  return {
    ...team,
    division_id: rest.division_id,
    group_id: rest.group_id,
    slug: rest.slug,
    division: rest.division ?? membership.team.divisions.find(
      (d) => d.division_id === rest.division_id,
    )?.division,
    group: rest.group ?? membership.team.divisions.find(
      (d) => d.division_id === rest.division_id,
    )?.group ?? null,
    division_ids: team.divisions.map((d) => d.division_id),
    divisions: team.divisions,
  };
}

export function teamFromMembership(
  membership: TeamDivision & {
    team: Team;
    division?: TeamWithMemberships['divisions'][0]['division'];
    group?: TeamWithMemberships['divisions'][0]['group'];
  },
): TeamInDivision {
  return {
    ...membership.team,
    division_id: membership.division_id,
    group_id: membership.group_id,
    slug: membership.slug,
    division: membership.division,
    group: membership.group ?? null,
  };
}

type TeamWithPrimaryMembership = {
  id: string;
  name: string;
  divisions: Array<{
    slug: string;
    division?: { id: string; name: string; slug?: string; tournament?: unknown };
  }>;
};

/** Flatten nested `divisions[0]` onto a team for backward-compatible API responses. */
export function mapTeamPrimaryMembership<T extends TeamWithPrimaryMembership>(
  team: T,
) {
  const m = team.divisions[0];
  const { divisions: _divisions, ...rest } = team;
  return {
    ...rest,
    slug: m?.slug ?? '',
    division: m?.division,
  };
}

export function mapCoachTeamRequest<
  T extends { team: TeamWithPrimaryMembership },
>(request: T) {
  return {
    ...request,
    team: mapTeamPrimaryMembership(request.team),
  };
}

export async function assertTeamInDivision(teamId: string, divisionId: string) {
  const membership = await prisma.teamDivision.findUnique({
    where: { team_id_division_id: { team_id: teamId, division_id: divisionId } },
  });
  if (!membership) {
    throw new BadRequestException('Team is not registered in this division');
  }
  return membership;
}

export async function assertTeamsInDivision(
  divisionId: string,
  teamIds: (string | null | undefined)[],
) {
  const ids = teamIds.filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;

  const count = await prisma.teamDivision.count({
    where: { division_id: divisionId, team_id: { in: ids } },
  });
  if (count !== ids.length) {
    throw new BadRequestException(
      'One or more teams are not registered in this division',
    );
  }
}

export async function assertSameTournamentDivisionIds(divisionIds: string[]) {
  if (divisionIds.length <= 1) return;
  const divisions = await prisma.division.findMany({
    where: { id: { in: divisionIds } },
    select: { id: true, tournament_id: true },
  });
  if (divisions.length !== divisionIds.length) {
    throw new BadRequestException('One or more divisions were not found');
  }
  const tournamentIds = new Set(divisions.map((d) => d.tournament_id));
  if (tournamentIds.size > 1) {
    throw new BadRequestException(
      'A team can only belong to divisions within the same tournament',
    );
  }
}

export async function listTeamsInDivision(divisionId: string) {
  return prisma.teamDivision.findMany({
    where: { division_id: divisionId },
    include: {
      team: { include: TEAM_DETAIL_INCLUDE },
      ...MEMBERSHIP_INCLUDE,
    },
    orderBy: { team: { name: 'asc' } },
  });
}

export async function findTeamInDivisionBySlug(divisionId: string, slug: string) {
  const membership = await prisma.teamDivision.findFirst({
    where: { division_id: divisionId, slug },
    include: {
      team: {
        include: {
          ...TEAM_DETAIL_INCLUDE,
          players: { orderBy: { last_name: 'asc' } },
          officials: { orderBy: [{ order: 'asc' }, { created_at: 'asc' }] },
          standings: { where: { division_id: divisionId } },
        },
      },
      ...MEMBERSHIP_INCLUDE,
    },
  });
  if (!membership) return null;
  return flattenMembershipRow(membership);
}

export async function createMembership(
  teamId: string,
  divisionId: string,
  opts?: { groupId?: string | null; slug?: string },
) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new NotFoundException('Team not found');

  const division = await prisma.division.findUnique({ where: { id: divisionId } });
  if (!division) throw new NotFoundException('Division not found');

  const existing = await prisma.teamDivision.findMany({
    where: { team_id: teamId },
    select: { division: { select: { tournament_id: true } } },
  });
  if (existing.length > 0) {
    const tournamentId = existing[0].division.tournament_id;
    if (division.tournament_id !== tournamentId) {
      throw new BadRequestException(
        'Team can only be added to divisions in the same tournament',
      );
    }
  }

  const slug =
    opts?.slug?.trim() ||
    (await uniqueSlugForDivision(divisionId, slugify(team.name)));

  const membership = await prisma.teamDivision.create({
    data: {
      team_id: teamId,
      division_id: divisionId,
      group_id: opts?.groupId ?? null,
      slug,
    },
    include: MEMBERSHIP_INCLUDE,
  });

  await prisma.standing.upsert({
    where: {
      division_id_team_id: { division_id: divisionId, team_id: teamId },
    },
    create: {
      division_id: divisionId,
      team_id: teamId,
      group_id: opts?.groupId ?? null,
      rank: 0,
    },
    update: { group_id: opts?.groupId ?? null },
  });

  return membership;
}

export async function removeMembership(teamId: string, divisionId: string) {
  const matchCount = await prisma.match.count({
    where: {
      division_id: divisionId,
      OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
    },
  });
  if (matchCount > 0) {
    throw new BadRequestException(
      'Cannot remove team from division while it has scheduled matches',
    );
  }

  await prisma.standing.deleteMany({
    where: { division_id: divisionId, team_id: teamId },
  });
  await prisma.teamDivision.delete({
    where: { team_id_division_id: { team_id: teamId, division_id: divisionId } },
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlugForDivision(divisionId: string, base: string): Promise<string> {
  let slug = base || 'team';
  let n = 2;
  while (
    await prisma.teamDivision.findUnique({
      where: { division_id_slug: { division_id: divisionId, slug } },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export { TEAM_DETAIL_INCLUDE, MEMBERSHIP_INCLUDE, slugify, uniqueSlugForDivision };

type MatchWithTeams = {
  division_id: string;
  home_team?: { id: string; name?: string; logo?: string | null } | null;
  away_team?: { id: string; name?: string; logo?: string | null } | null;
};

/** Attach division-scoped slugs to match home/away teams (slug lives on TeamDivision). */
export async function enrichMatchesWithTeamSlugs<T extends MatchWithTeams>(
  matches: T[],
): Promise<T[]> {
  if (matches.length === 0) return matches;

  const divisionIds = [...new Set(matches.map((m) => m.division_id))];
  const teamIds = [
    ...new Set(
      matches.flatMap((m) =>
        [m.home_team?.id, m.away_team?.id].filter((id): id is string => Boolean(id)),
      ),
    ),
  ];
  if (teamIds.length === 0) return matches;

  const memberships = await prisma.teamDivision.findMany({
    where: {
      division_id: { in: divisionIds },
      team_id: { in: teamIds },
    },
    select: { division_id: true, team_id: true, slug: true },
  });
  const key = (divisionId: string, teamId: string) => `${divisionId}:${teamId}`;
  const slugByKey = new Map(
    memberships.map((m) => [key(m.division_id, m.team_id), m.slug]),
  );

  return matches.map((match) => ({
    ...match,
    home_team: match.home_team
      ? {
          ...match.home_team,
          slug: slugByKey.get(key(match.division_id, match.home_team.id)) ?? '',
        }
      : match.home_team,
    away_team: match.away_team
      ? {
          ...match.away_team,
          slug: slugByKey.get(key(match.division_id, match.away_team.id)) ?? '',
        }
      : match.away_team,
  }));
}

export async function enrichMatchWithTeamSlugs<T extends MatchWithTeams>(
  match: T,
): Promise<T> {
  const [enriched] = await enrichMatchesWithTeamSlugs([match]);
  return enriched;
}
