import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';
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

const ENTITY = 'Team';

/** Client-settable scalar fields on a team. */
const TEAM_FIELDS = [
  'division_id',
  'name',
  'slug',
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

  /** Auto-scoped by the soft-delete extension (active/deleted/all via request scope). */
  async findAll(params?: { divisionId?: string }) {
    const ctx = await getRosterVisibilityContext();
    const teams = await prisma.team.findMany({
      where: params?.divisionId
        ? { division_id: params.divisionId }
        : undefined,
      include: {
        division: { include: { tournament: true } },
        coach: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        players: { where: { active: true }, orderBy: { last_name: 'asc' } },
      },
    });

    return teams.map((team) =>
      stripTeamPlayers(
        team,
        canViewTeamRoster(ctx.actor, team.coach_user_id, ctx.rostersPublic),
      ),
    );
  }

  async findOneInDivision(divisionId: string, slug: string) {
    // findFirst so the soft-delete extension hides deleted teams from the public.
    const team = await prisma.team.findFirst({
      where: { division_id: divisionId, slug },
      include: {
        division: { include: { tournament: true } },
        coach: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        players: { orderBy: { last_name: 'asc' } },
        standings: true,
      },
    });
    if (!team) throw new NotFoundException('Team not found');

    const ctx = await getRosterVisibilityContext();
    return stripTeamPlayers(
      team,
      canViewTeamRoster(ctx.actor, team.coach_user_id, ctx.rostersPublic),
    );
  }

  async create(data: unknown) {
    const payload = pickAllowed(data, TEAM_FIELDS);
    const coachUserId = payload.coach_user_id as string | null | undefined;
    if (coachUserId) {
      await validateCoachCanBeAssigned(coachUserId, null);
    }

    const team = await this.auditable.createAudited(
      (tx) => asAuditable(tx.team),
      ENTITY,
      {
        ...payload,
        coach_user_id: coachUserId ? undefined : payload.coach_user_id,
      },
    );

    if (coachUserId) {
      await applyCoachTeamAssignment(team.id, coachUserId);
      return prisma.team.findUnique({
        where: { id: team.id },
        include: {
          division: { include: { tournament: true } },
          coach: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });
    }

    return team;
  }

  async update(id: string, data: unknown) {
    const payload = pickAllowed(data, TEAM_FIELDS);
    const coachUserId = payload.coach_user_id as string | null | undefined;

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
        include: {
          division: { include: { tournament: true } },
          coach: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });
    }

    return this.auditable.updateAudited(
      (tx) => asAuditable(tx.team),
      ENTITY,
      id,
      payload,
    );
  }

  /** Soft delete (decommission) — never removes the row. */
  remove(id: string) {
    return this.auditable.softDelete((tx) => asAuditable(tx.team), ENTITY, id);
  }

  restore(id: string) {
    return this.auditable.restore((tx) => asAuditable(tx.team), ENTITY, id);
  }

  /** Permanent hard delete — admin only. */
  purge(id: string) {
    return this.auditable.purge((tx) => asAuditable(tx.team), ENTITY, id);
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
