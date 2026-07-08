import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';
import { handlePrismaError } from '../../common/prisma-errors';
import {
  assertDivisionEditable,
  assertTeamEditable,
  assertTournamentEditable,
} from '../../common/assert-tournament-editable';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditableService, asAuditable } from '../audit-log/auditable.service';
import {
  applyCoachTeamAssignment,
  validateCoachCanBeAssigned,
} from './coach-team-link';
import {
  canViewTeamRoster,
  getRosterVisibilityContext,
  stripTeamPlayers,
} from '../auth/roster-visibility';
import {
  createMembership,
  flattenMembershipRow,
  flattenTeamForDivision,
  findTeamInDivisionBySlug,
  listTeamsInDivision,
  removeMembership,
  slugify,
  TEAM_DETAIL_INCLUDE,
  type TeamInDivision,
} from './team-membership';

const ENTITY = 'Team';

/** Client-settable scalar fields on a team (identity — not division membership). */
const TEAM_FIELDS = [
  'name',
  'logo',
  'city',
  'founded_year',
  'primary_color',
  'secondary_color',
  'coach_user_id',
  'management_locked',
  'contact_email',
  'contact_phone',
] as const;

@Injectable()
export class TeamsService {
  constructor(
    private readonly auditable: AuditableService,
    private readonly audit: AuditLogService,
  ) {}

  private async playerCountsByTeamId(
    teamIds: string[],
  ): Promise<Map<string, number>> {
    if (teamIds.length === 0) return new Map();

    const rows = await prisma.player.groupBy({
      by: ['team_id'],
      where: { team_id: { in: teamIds } },
      _count: { _all: true },
    });

    return new Map(rows.map((row) => [row.team_id, row._count._all]));
  }

  private async presentTeamInDivision(
    team: TeamInDivision,
  ): Promise<TeamInDivision> {
    const ctx = await getRosterVisibilityContext();
    const canView = canViewTeamRoster(
      ctx.actor,
      team.coach_user_id,
      ctx.rostersPublic,
    );
    const counts = await this.playerCountsByTeamId([team.id]);
    const stripped = stripTeamPlayers(team, canView) as TeamInDivision;
    const count = counts.get(team.id) ?? 0;
    return {
      ...stripped,
      ...(canView ? { roster_count: count } : {}),
    };
  }

  /** Auto-scoped by the soft-delete extension (active/deleted/all via request scope). */
  async findAll(params?: { divisionId?: string }) {
    const ctx = await getRosterVisibilityContext();

    const rows = params?.divisionId
      ? (await listTeamsInDivision(params.divisionId)).map(flattenMembershipRow)
      : (
          await prisma.team.findMany({
            include: TEAM_DETAIL_INCLUDE,
            orderBy: { name: 'asc' },
          })
        ).flatMap((team) =>
          team.divisions.map((membership) =>
            flattenMembershipRow({ ...membership, team }),
          ),
        );

    const rosterCounts = await this.playerCountsByTeamId(
      [...new Set(rows.map((t) => t.id))],
    );

    return rows.map((team) => {
      const canView = canViewTeamRoster(
        ctx.actor,
        team.coach_user_id,
        ctx.rostersPublic,
      );
      const stripped = stripTeamPlayers(team, canView) as TeamInDivision;
      const count = rosterCounts.get(team.id) ?? 0;
      return {
        ...stripped,
        ...(canView ? { roster_count: count } : {}),
      };
    });
  }

  /** Public, lightweight list of teams that don't yet have a coach. */
  directory() {
    return prisma.team.findMany({
      where: { coach_user_id: null },
      select: {
        id: true,
        name: true,
        divisions: {
          select: {
            slug: true,
            division: {
              select: {
                id: true,
                name: true,
                slug: true,
                tournament: { select: { name: true, slug: true } },
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    }).then((teams) =>
      teams.map((t) => ({
        id: t.id,
        name: t.name,
        division: t.divisions[0]?.division ?? undefined,
      })),
    );
  }

  async findOneInDivision(divisionId: string, slug: string) {
    const team = await findTeamInDivisionBySlug(divisionId, slug);
    if (!team) throw new NotFoundException('Team not found');
    return this.presentTeamInDivision(team);
  }

  async findById(id: string) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: TEAM_DETAIL_INCLUDE,
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async create(data: unknown) {
    const payload = pickAllowed(data, [
      ...TEAM_FIELDS,
      'division_id',
      'division_ids',
      'slug',
      'group_id',
      'created_by',
    ]) as Record<string, unknown>;

    const divisionIds = [
      ...(payload.division_id ? [String(payload.division_id)] : []),
      ...((payload.division_ids as string[] | undefined) ?? []),
    ].filter((id, idx, arr) => arr.indexOf(id) === idx);

    if (divisionIds.length === 0) {
      throw new BadRequestException('At least one division_id is required');
    }

    for (const divisionId of divisionIds) {
      await assertDivisionEditable(divisionId);
    }

    const coachUserId = payload.coach_user_id as string | null | undefined;
    if (coachUserId) {
      await validateCoachCanBeAssigned(coachUserId);
    }

    const teamScalars = pickAllowed(payload, TEAM_FIELDS);

    try {
      const team = await this.auditable.createAudited(
        (tx) => asAuditable(tx.team),
        ENTITY,
        {
          ...teamScalars,
          coach_user_id: coachUserId ? undefined : payload.coach_user_id,
          created_by: payload.created_by,
        },
      );

      const primarySlug =
        typeof payload.slug === 'string' && payload.slug.trim()
          ? payload.slug.trim()
          : slugify(String(payload.name ?? 'team'));

      for (let i = 0; i < divisionIds.length; i++) {
        await createMembership(team.id, divisionIds[i], {
          groupId: i === 0 ? (payload.group_id as string | null | undefined) ?? null : null,
          slug: i === 0 ? primarySlug : undefined,
        });
      }

      if (coachUserId) {
        await applyCoachTeamAssignment(team.id, coachUserId);
      }

      const created = await prisma.team.findUnique({
        where: { id: team.id },
        include: TEAM_DETAIL_INCLUDE,
      });
      return flattenTeamForDivision(created!, divisionIds[0]);
    } catch (err) {
      handlePrismaError(err, 'Team create');
    }
  }

  async update(id: string, data: unknown) {
    await assertTeamEditable(id);
    const payload = pickAllowed(data, TEAM_FIELDS);
    const coachUserId = payload.coach_user_id as string | null | undefined;

    try {
      if (coachUserId !== undefined) {
        const rest = { ...payload } as Record<string, unknown>;
        delete rest.coach_user_id;
        const updated = await this.auditable.updateAudited(
          (tx) => asAuditable(tx.team),
          ENTITY,
          id,
          rest,
        );
        await applyCoachTeamAssignment(id, coachUserId ?? null);
        return prisma.team.findUnique({
          where: { id: updated.id },
          include: TEAM_DETAIL_INCLUDE,
        });
      }

      return this.auditable.updateAudited(
        (tx) => asAuditable(tx.team),
        ENTITY,
        id,
        payload,
      );
    } catch (err) {
      handlePrismaError(err, 'Team update');
    }
  }

  async addToDivision(
    teamId: string,
    divisionId: string,
    opts?: { slug?: string; group_id?: string | null },
  ) {
    try {
      await createMembership(teamId, divisionId, {
        slug: opts?.slug,
        groupId: opts?.group_id ?? null,
      });
      const row = await prisma.teamDivision.findUniqueOrThrow({
        where: { team_id_division_id: { team_id: teamId, division_id: divisionId } },
        include: {
          team: { include: TEAM_DETAIL_INCLUDE },
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
        },
      });
      return flattenMembershipRow(row);
    } catch (err) {
      handlePrismaError(err, 'Add team to division');
    }
  }

  async removeFromDivision(teamId: string, divisionId: string) {
    try {
      await removeMembership(teamId, divisionId);
      return { team_id: teamId, division_id: divisionId };
    } catch (err) {
      handlePrismaError(err, 'Remove team from division');
    }
  }

  /** Soft delete (decommission) — never removes the row. */
  async remove(id: string) {
    await assertTeamEditable(id);
    return this.auditable.softDelete((tx) => asAuditable(tx.team), ENTITY, id);
  }

  restore(id: string) {
    return this.auditable.restore((tx) => asAuditable(tx.team), ENTITY, id);
  }

  /** Permanent hard delete — admin only. */
  purge(id: string) {
    try {
      return this.auditable.purge((tx) => asAuditable(tx.team), ENTITY, id);
    } catch (err) {
      handlePrismaError(err, 'Team purge');
    }
  }

  history(id: string) {
    return this.audit.listVersions(ENTITY, id);
  }

  async restoreVersion(id: string, versionId: string) {
    const version = await this.audit.getVersion(versionId);
    if (
      !version ||
      version.entity_type !== ENTITY ||
      version.entity_id !== id
    ) {
      throw new NotFoundException('Version not found for this team');
    }
    const snapshot = (version.new_values ?? {}) as Record<string, unknown>;
    return this.auditable.restoreVersion(
      (tx) => asAuditable(tx.team),
      ENTITY,
      id,
      pickAllowed(snapshot, TEAM_FIELDS),
      version.version,
    );
  }
}
