import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MatchStatus, Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditableService, asAuditable } from '../audit-log/auditable.service';

const ENTITY = 'Tournament';

function mapDivisionCounts<T extends {
  _count?: { team_memberships?: number; matches?: number };
}>(division: T) {
  if (!division._count) return division;
  const { team_memberships, matches } = division._count;
  return {
    ...division,
    _count: {
      teams: team_memberships ?? 0,
      matches: matches ?? 0,
    },
  };
}

function mapTournamentDivisions<T extends { divisions: Array<Parameters<typeof mapDivisionCounts>[0]> }>(
  tournament: T,
) {
  return {
    ...tournament,
    divisions: tournament.divisions.map(mapDivisionCounts),
  };
}

const TOURNAMENT_FIELDS = [
  'name',
  'slug',
  'description',
  'location',
  'start_date',
  'end_date',
  'status',
  'tournament_type',
  'logo',
  'rules',
] as const;

/** `created_by` may be set only at creation time, never via update. */
const TOURNAMENT_CREATE_FIELDS = [...TOURNAMENT_FIELDS, 'created_by'] as const;

@Injectable()
export class TournamentsService {
  constructor(
    private readonly auditable: AuditableService,
    private readonly audit: AuditLogService,
  ) {}

  /** List is auto-scoped by the soft-delete extension (active/deleted/all via request scope). */
  findAll(params?: { status?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20, status } = params ?? {};
    return prisma.tournament.findMany({
      where: status
        ? { status: status as Prisma.EnumTournamentStatusFilter }
        : undefined,
      include: {
        divisions: {
          orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { start_date: 'desc' },
    });
  }

  async findOne(slug: string) {
    // findFirst (not findUnique) so the soft-delete extension hides deleted records from the public.
    const t = await prisma.tournament.findFirst({
      where: { slug },
      include: {
        divisions: {
          select: {
            id: true,
            name: true,
            slug: true,
            age_group: true,
            gender: true,
            format: true,
            primary_color: true,
            accent_color: true,
            groups_enabled: true,
            display_order: true,
            _count: { select: { team_memberships: true } },
          },
          orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
        },
      },
    });
    if (!t) throw new NotFoundException('Tournament not found');
    return mapTournamentDivisions(t);
  }

  async getOverview(slug: string) {
    const tournament = await this.findOne(slug);
    const divisionIds = tournament.divisions.map((d) => d.id);

    const [matches, standingsPreview] = await Promise.all([
      prisma.match.findMany({
        where: { tournament_id: tournament.id },
        include: {
          home_team: true,
          away_team: true,
          division: { include: { tournament: true } },
          venue: true,
        },
        orderBy: { scheduled_start: 'asc' },
        take: 40,
      }),
      divisionIds.length
        ? prisma.standing.findMany({
            where: { division_id: divisionIds[0] },
            include: { team: true },
            orderBy: [
              { points: 'desc' },
              { goal_difference: 'desc' },
              { goals_for: 'desc' },
            ],
            take: 3,
          })
        : Promise.resolve([]),
    ]);

    const liveMatches = matches.filter(
      (m) => m.status === ('LIVE' as MatchStatus),
    );
    const recentMatches = matches
      .filter((m) => m.status === 'COMPLETED')
      .slice(-4)
      .reverse();
    const upcomingMatches = matches
      .filter((m) => m.status === 'SCHEDULED')
      .slice(0, 4);

    return {
      tournament,
      liveMatches,
      recentMatches,
      upcomingMatches,
      standingsPreview,
    };
  }

  /** Admin single-record lookup by id — intentionally NOT scoped, so deleted records stay inspectable/restorable. */
  async findById(id: string) {
    const t = await prisma.tournament.findUnique({
      where: { id },
      include: {
        divisions: {
          select: {
            id: true,
            name: true,
            slug: true,
            age_group: true,
            gender: true,
            format: true,
            primary_color: true,
            accent_color: true,
            groups_enabled: true,
            display_order: true,
            _count: { select: { team_memberships: true, matches: true } },
          },
          orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
        },
      },
    });
    if (!t) throw new NotFoundException('Tournament not found');
    return mapTournamentDivisions(t);
  }

  create(data: unknown) {
    return this.auditable.createAudited(
      (tx) => asAuditable(tx.tournament),
      ENTITY,
      pickAllowed(data, TOURNAMENT_CREATE_FIELDS),
    );
  }

  update(id: string, data: unknown) {
    return this.auditable.updateAudited(
      (tx) => asAuditable(tx.tournament),
      ENTITY,
      id,
      pickAllowed(data, TOURNAMENT_FIELDS),
    );
  }

  /** Soft delete (decommission) — never removes the row. */
  async remove(id: string) {
    try {
      return await this.auditable.softDelete(
        (tx) => asAuditable(tx.tournament),
        ENTITY,
        id,
      );
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete this tournament because related data could not be decommissioned.',
        );
      }
      throw err;
    }
  }

  restore(id: string) {
    return this.auditable.restore(
      (tx) => asAuditable(tx.tournament),
      ENTITY,
      id,
    );
  }

  /** Permanent hard delete — admin only. */
  async purge(id: string) {
    const existing = await prisma.tournament.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tournament not found');

    try {
      await prisma.$transaction(async (tx) => {
        // Matches reference teams without onDelete — remove before divisions/teams cascade.
        await tx.match.deleteMany({ where: { tournament_id: id } });
        await tx.division.deleteMany({ where: { tournament_id: id } });
        await tx.tournament.delete({ where: { id } });
      });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2003') {
        throw new BadRequestException(
          'Cannot permanently delete this tournament because related data is still linked.',
        );
      }
      throw err;
    }

    await this.audit.log({
      action: 'PURGE',
      entity: ENTITY,
      entityId: id,
      metadata: { name: existing.name, slug: existing.slug },
    });

    return { id };
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
      throw new NotFoundException('Version not found for this tournament');
    }
    const snapshot = (version.new_values ?? {}) as Record<string, unknown>;
    return this.auditable.restoreVersion(
      (tx) => asAuditable(tx.tournament),
      ENTITY,
      id,
      pickAllowed(snapshot, TOURNAMENT_FIELDS),
      version.version,
    );
  }
}
