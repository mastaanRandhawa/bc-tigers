import { Injectable, NotFoundException } from '@nestjs/common';
import type { MatchStatus, Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditableService, asAuditable } from '../audit-log/auditable.service';

const ENTITY = 'Tournament';

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
      include: { divisions: true },
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
            _count: { select: { teams: true } },
          },
        },
      },
    });
    if (!t) throw new NotFoundException('Tournament not found');
    return t;
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
              { fair_play: 'desc' },
            ],
            take: 3,
          })
        : Promise.resolve([]),
    ]);

    const liveMatches = matches.filter((m) => m.status === ('LIVE' as MatchStatus));
    const recentMatches = matches
      .filter((m) => m.status === 'COMPLETED')
      .slice(-4)
      .reverse();
    const upcomingMatches = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 4);

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
            _count: { select: { teams: true, matches: true } },
          },
        },
      },
    });
    if (!t) throw new NotFoundException('Tournament not found');
    return t;
  }

  create(data: unknown) {
    return this.auditable.createAudited(
      asAuditable(prisma.tournament),
      ENTITY,
      pickAllowed(data, TOURNAMENT_CREATE_FIELDS) as Record<string, unknown>,
    );
  }

  update(id: string, data: unknown) {
    return this.auditable.updateAudited(
      asAuditable(prisma.tournament),
      ENTITY,
      id,
      pickAllowed(data, TOURNAMENT_FIELDS) as Record<string, unknown>,
    );
  }

  /** Soft delete (decommission) — never removes the row. */
  remove(id: string) {
    return this.auditable.softDelete(asAuditable(prisma.tournament), ENTITY, id);
  }

  restore(id: string) {
    return this.auditable.restore(asAuditable(prisma.tournament), ENTITY, id);
  }

  /** Permanent hard delete — admin only. */
  purge(id: string) {
    return this.auditable.purge(asAuditable(prisma.tournament), ENTITY, id);
  }

  history(id: string) {
    return this.audit.listVersions(ENTITY, id);
  }

  async restoreVersion(id: string, versionId: string) {
    const version = await this.audit.getVersion(versionId);
    if (!version || version.entity_type !== ENTITY || version.entity_id !== id) {
      throw new NotFoundException('Version not found for this tournament');
    }
    const snapshot = (version.new_values ?? {}) as Record<string, unknown>;
    return this.auditable.restoreVersion(
      asAuditable(prisma.tournament),
      ENTITY,
      id,
      pickAllowed(snapshot, TOURNAMENT_FIELDS) as Record<string, unknown>,
      version.version,
    );
  }
}
