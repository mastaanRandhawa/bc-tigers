import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { handlePrismaError } from '../../common/prisma-errors';
import { StandingsService } from '../standings/standings.service';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const GROUP_INCLUDE = {
  team_memberships: {
    include: {
      team: { select: { id: true, name: true, logo: true } },
    },
    orderBy: { team: { name: 'asc' } },
  },
  _count: { select: { team_memberships: true, matches: true } },
} as const;

function mapGroup<
  T extends {
    team_memberships: Array<{
      team: { id: string; name: string; logo: string | null };
      slug: string;
    }>;
    _count?: { team_memberships: number; matches: number };
  },
>(group: T) {
  return {
    ...group,
    teams: group.team_memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      logo: m.team.logo,
      slug: m.slug,
    })),
    _count: group._count
      ? { teams: group._count.team_memberships, matches: group._count.matches }
      : undefined,
  };
}

@Injectable()
export class GroupsService {
  constructor(private readonly standings: StandingsService) {}

  listByDivision(divisionId: string) {
    return prisma.group
      .findMany({
        where: { division_id: divisionId },
        include: GROUP_INCLUDE,
        orderBy: { order: 'asc' },
      })
      .then((groups) => groups.map(mapGroup));
  }

  private async ensureDivision(divisionId: string) {
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
      select: { id: true },
    });
    if (!division) throw new NotFoundException('Division not found');
    return division;
  }

  async create(divisionId: string, body: Record<string, unknown>) {
    await this.ensureDivision(divisionId);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) throw new BadRequestException('Group name is required');

    const baseSlug =
      typeof body.slug === 'string' && body.slug.trim()
        ? slugify(body.slug)
        : slugify(name);
    const slug = baseSlug || `group-${Date.now()}`;

    const existing = await prisma.group.findUnique({
      where: { division_id_slug: { division_id: divisionId, slug } },
    });
    if (existing) {
      throw new BadRequestException(
        `A group with slug "${slug}" already exists in this division`,
      );
    }

    const count = await prisma.group.count({
      where: { division_id: divisionId },
    });
    const order = typeof body.order === 'number' ? body.order : count;

    try {
      return await prisma.group.create({
        data: { division_id: divisionId, name, slug, order },
        include: GROUP_INCLUDE,
      }).then(mapGroup);
    } catch (err) {
      handlePrismaError(err, 'Group create');
    }
  }

  async update(id: string, body: Record<string, unknown>) {
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');

    const data: { name?: string; slug?: string; order?: number } = {};
    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (typeof body.slug === 'string' && body.slug.trim()) {
      data.slug = slugify(body.slug);
    }
    if (typeof body.order === 'number') {
      data.order = body.order;
    }

    return prisma.group
      .update({
        where: { id },
        data,
        include: GROUP_INCLUDE,
      })
      .then(mapGroup);
  }

  async remove(id: string) {
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    // Teams/matches/standings keep their rows; their group_id is set null (FK).
    await prisma.group.delete({ where: { id } });
    await this.standings.recalculate(group.division_id);
    return { id };
  }

  /** Persist a new display order for a division's groups. */
  async reorder(divisionId: string, orderedIds: string[]) {
    await this.ensureDivision(divisionId);
    await prisma.$transaction(
      orderedIds.map((groupId, index) =>
        prisma.group.updateMany({
          where: { id: groupId, division_id: divisionId },
          data: { order: index },
        }),
      ),
    );
    return this.listByDivision(divisionId);
  }

  /**
   * Assign teams to groups (or clear an assignment with group_id null). Each
   * team and group must belong to the division. Standings are recalculated so
   * group tables reflect the new membership immediately.
   */
  async assignTeams(
    divisionId: string,
    assignments: { team_id: string; group_id: string | null }[],
  ) {
    await this.ensureDivision(divisionId);
    if (!Array.isArray(assignments)) {
      throw new BadRequestException('assignments must be an array');
    }

    const [memberships, divisionGroups] = await Promise.all([
      prisma.teamDivision.findMany({
        where: { division_id: divisionId },
        select: { team_id: true },
      }),
      prisma.group.findMany({
        where: { division_id: divisionId },
        select: { id: true },
      }),
    ]);
    const teamIds = new Set(memberships.map((t) => t.team_id));
    const groupIds = new Set(divisionGroups.map((g) => g.id));

    for (const a of assignments) {
      if (!teamIds.has(a.team_id)) {
        throw new BadRequestException(
          `Team ${a.team_id} is not in this division`,
        );
      }
      if (a.group_id !== null && !groupIds.has(a.group_id)) {
        throw new BadRequestException(
          `Group ${a.group_id} is not in this division`,
        );
      }
    }

    await prisma.$transaction([
      ...assignments.map((a) =>
        prisma.teamDivision.updateMany({
          where: { division_id: divisionId, team_id: a.team_id },
          data: { group_id: a.group_id },
        }),
      ),
      ...assignments.map((a) =>
        prisma.standing.updateMany({
          where: { division_id: divisionId, team_id: a.team_id },
          data: { group_id: a.group_id },
        }),
      ),
    ]);

    await this.standings.recalculate(divisionId);
    return this.listByDivision(divisionId);
  }
}
