import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { roundRobinPairs } from '../../common/round-robin';
import { pickAllowed } from '../../common/pick';
import { AuditLogService } from '../audit-log/audit-log.service';
import { StandingsService } from '../standings/standings.service';

/** Client-settable scalar fields on a division. `bracket_locked` is managed by the brackets module. */
const DIVISION_FIELDS = [
  'tournament_id',
  'name',
  'slug',
  'age_group',
  'gender',
  'max_teams',
  'format',
  'point_format_id',
  'primary_color',
  'accent_color',
  'schedule_only',
  'groups_enabled',
  'display_order',
] as const;

/** Stable ordering for public/admin division lists: display_order, then creation. */
const DIVISION_ORDER_BY = [
  { display_order: 'asc' as const },
  { created_at: 'asc' as const },
];

const DIVISION_INCLUDE = {
  tournament: true,
  point_format: true,
} as const;

/** Prisma update accepts relation connects, not raw FK scalars on this model. */
function buildDivisionUpdateData(
  payload: Record<string, unknown>,
): Prisma.DivisionUpdateInput {
  const data: Prisma.DivisionUpdateInput = {};

  if (payload.name !== undefined) data.name = payload.name as string;
  if (payload.slug !== undefined) data.slug = payload.slug as string;
  if (payload.age_group !== undefined) {
    data.age_group = payload.age_group;
  }
  if (payload.gender !== undefined) {
    data.gender = payload.gender as Prisma.DivisionUpdateInput['gender'];
  }
  if (payload.max_teams !== undefined && payload.max_teams !== null) {
    data.max_teams = payload.max_teams;
  }
  if (payload.format !== undefined) data.format = payload.format as string;
  if (payload.primary_color !== undefined) {
    data.primary_color = payload.primary_color;
  }
  if (payload.accent_color !== undefined) {
    data.accent_color = payload.accent_color;
  }
  if (payload.schedule_only !== undefined) {
    data.schedule_only = Boolean(payload.schedule_only);
  }
  if (payload.groups_enabled !== undefined) {
    data.groups_enabled = Boolean(payload.groups_enabled);
  }
  if (payload.display_order !== undefined && payload.display_order !== null) {
    data.display_order = Number(payload.display_order);
  }
  if (payload.tournament_id) {
    data.tournament = { connect: { id: payload.tournament_id as string } };
  }
  if (payload.point_format_id) {
    data.point_format = { connect: { id: payload.point_format_id as string } };
  }

  return data;
}

@Injectable()
export class DivisionsService {
  constructor(
    private readonly audit: AuditLogService,
    private readonly standings: StandingsService,
  ) {}

  async findByTournament(tournamentSlug: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { slug: tournamentSlug },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    return prisma.division.findMany({
      where: { tournament_id: tournament.id },
      include: { teams: true, point_format: true },
      orderBy: DIVISION_ORDER_BY,
    });
  }

  async findOne(tournamentSlug: string, divisionSlug: string) {
    return this.resolveDivision(tournamentSlug, divisionSlug, {
      tournament: true,
      point_format: true,
      teams: true,
      standings: { include: { team: true }, orderBy: { rank: 'asc' } },
      matches: { include: { home_team: true, away_team: true } },
    });
  }

  async resolveDivision(
    tournamentSlug: string,
    divisionSlug: string,
    include?: Parameters<typeof prisma.division.findUnique>[0]['include'],
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { slug: tournamentSlug },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    const division = await prisma.division.findUnique({
      where: {
        tournament_id_slug: {
          tournament_id: tournament.id,
          slug: divisionSlug,
        },
      },
      include: include ?? DIVISION_INCLUDE,
    });
    if (!division) throw new NotFoundException('Division not found');
    return division;
  }

  findAll() {
    return prisma.division.findMany({
      include: DIVISION_INCLUDE,
      orderBy: DIVISION_ORDER_BY,
    });
  }

  /** Persist a new display order for a tournament's divisions (admin reorder). */
  async reorder(orderedIds: string[]) {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.division.update({
          where: { id },
          data: { display_order: index },
        }),
      ),
    );
    return { ordered: orderedIds.length };
  }

  async findBySlugGlobal(divisionSlug: string) {
    const divisions = await prisma.division.findMany({
      where: { slug: divisionSlug },
      include: DIVISION_INCLUDE,
    });
    if (divisions.length === 0)
      throw new NotFoundException('Division not found');
    if (divisions.length > 1) {
      return divisions;
    }
    return divisions[0];
  }

  create(data: unknown) {
    return prisma.division.create({
      data: pickAllowed<Prisma.DivisionUncheckedCreateInput>(
        data,
        DIVISION_FIELDS,
      ),
      include: DIVISION_INCLUDE,
    });
  }

  async update(id: string, data: unknown) {
    const existing = await prisma.division.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Division not found');

    const picked = pickAllowed<Record<string, unknown>>(data, DIVISION_FIELDS);
    const nextPointFormatId =
      typeof picked.point_format_id === 'string'
        ? picked.point_format_id
        : undefined;

    const division = await prisma.division.update({
      where: { id },
      data: buildDivisionUpdateData(picked),
      include: DIVISION_INCLUDE,
    });

    const pointFormatChanged =
      nextPointFormatId && nextPointFormatId !== existing.point_format_id;
    const groupsToggled =
      picked.groups_enabled !== undefined &&
      Boolean(picked.groups_enabled) !== existing.groups_enabled;
    if (pointFormatChanged || groupsToggled) {
      // Group membership / point rules changed → standings must be rebuilt
      // (grouped tables vs a single division table produce different ranks).
      await this.standings.recalculate(id);
    }

    return division;
  }

  remove(id: string) {
    return prisma.division.delete({ where: { id } });
  }

  async generateSchedule(
    divisionId: string,
    options?: {
      startDate?: string;
      matchIntervalMinutes?: number;
      venueId?: string;
      fieldId?: string;
      force?: boolean;
    },
  ) {
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
      include: { teams: true, tournament: true },
    });
    if (!division) throw new NotFoundException('Division not found');

    const existingCount = await prisma.match.count({
      where: { division_id: divisionId },
    });
    if (existingCount > 0 && !options?.force) {
      throw new BadRequestException(
        'Division already has matches. Pass force=true to replace.',
      );
    }

    if (options?.force && existingCount > 0) {
      await prisma.match.deleteMany({ where: { division_id: divisionId } });
    }

    const teamIds = division.teams.map((t) => t.id);
    if (teamIds.length < 2) {
      throw new BadRequestException(
        'At least 2 teams required to generate a schedule',
      );
    }

    const pairs = roundRobinPairs(teamIds);
    const intervalMs = (options?.matchIntervalMinutes ?? 90) * 60 * 1000;
    const start = options?.startDate
      ? new Date(options.startDate)
      : new Date(division.tournament.start_date);

    const matches = await prisma.$transaction(
      pairs.map(([homeId, awayId], index) => {
        const scheduled_start = new Date(start.getTime() + index * intervalMs);
        return prisma.match.create({
          data: {
            tournament_id: division.tournament_id,
            division_id: divisionId,
            home_team_id: homeId,
            away_team_id: awayId,
            venue_id: options?.venueId ?? null,
            field_id: options?.fieldId ?? null,
            scheduled_start,
            status: 'SCHEDULED',
            round: Math.floor(index / Math.max(1, teamIds.length - 1)) + 1,
          },
        });
      }),
    );

    await this.audit.log({
      action: 'SCHEDULE_GENERATION',
      entity: 'Division',
      entityId: divisionId,
      metadata: { created: matches.length },
    });
    return { created: matches.length, matches };
  }
}
