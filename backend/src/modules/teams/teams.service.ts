import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditableService, asAuditable } from '../audit-log/auditable.service';

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
] as const;

@Injectable()
export class TeamsService {
  constructor(
    private readonly auditable: AuditableService,
    private readonly audit: AuditLogService,
  ) {}

  /** Auto-scoped by the soft-delete extension (active/deleted/all via request scope). */
  findAll(params?: { divisionId?: string }) {
    return prisma.team.findMany({
      where: params?.divisionId
        ? { division_id: params.divisionId }
        : undefined,
      include: {
        division: { include: { tournament: true } },
        players: { where: { active: true }, orderBy: { last_name: 'asc' } },
      },
    });
  }

  async findOneInDivision(divisionId: string, slug: string) {
    // findFirst so the soft-delete extension hides deleted teams from the public.
    const team = await prisma.team.findFirst({
      where: { division_id: divisionId, slug },
      include: {
        division: { include: { tournament: true } },
        players: { orderBy: { last_name: 'asc' } },
        standings: true,
      },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  create(data: unknown) {
    return this.auditable.createAudited(
      asAuditable(prisma.team),
      ENTITY,
      pickAllowed(data, TEAM_FIELDS) as Record<string, unknown>,
    );
  }

  update(id: string, data: unknown) {
    return this.auditable.updateAudited(
      asAuditable(prisma.team),
      ENTITY,
      id,
      pickAllowed(data, TEAM_FIELDS) as Record<string, unknown>,
    );
  }

  /** Soft delete (decommission) — never removes the row. */
  remove(id: string) {
    return this.auditable.softDelete(asAuditable(prisma.team), ENTITY, id);
  }

  restore(id: string) {
    return this.auditable.restore(asAuditable(prisma.team), ENTITY, id);
  }

  /** Permanent hard delete — admin only. */
  purge(id: string) {
    return this.auditable.purge(asAuditable(prisma.team), ENTITY, id);
  }

  history(id: string) {
    return this.audit.listVersions(ENTITY, id);
  }

  async restoreVersion(id: string, versionId: string) {
    const version = await this.audit.getVersion(versionId);
    if (!version || version.entity_type !== ENTITY || version.entity_id !== id) {
      throw new NotFoundException('Version not found for this team');
    }
    const snapshot = (version.new_values ?? {}) as Record<string, unknown>;
    return this.auditable.restoreVersion(
      asAuditable(prisma.team),
      ENTITY,
      id,
      pickAllowed(snapshot, TEAM_FIELDS) as Record<string, unknown>,
      version.version,
    );
  }
}
