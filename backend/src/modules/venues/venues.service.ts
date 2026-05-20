import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

@Injectable()
export class VenuesService {
  findAll() {
    return prisma.venue.findMany({ include: { fields: true } });
  }

  async findOne(slug: string) {
    const v = await prisma.venue.findUnique({
      where: { slug },
      include: {
        fields: true,
        matches: {
          include: { home_team: true, away_team: true },
          take: 5,
          orderBy: { scheduled_start: 'asc' },
        },
      },
    });
    if (!v) throw new NotFoundException('Venue not found');
    return v;
  }

  findByDivision(divisionId: string) {
    return prisma.venue.findMany({
      where: {
        matches: { some: { division_id: divisionId } },
      },
      include: { fields: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOneInDivision(divisionId: string, slug: string) {
    const venue = await prisma.venue.findFirst({
      where: {
        slug,
        matches: { some: { division_id: divisionId } },
      },
      include: {
        fields: true,
        matches: {
          where: { division_id: divisionId },
          include: { home_team: true, away_team: true, division: true },
          orderBy: { scheduled_start: 'asc' },
        },
      },
    });
    if (!venue) throw new NotFoundException('Venue not found in this division');
    return venue;
  }

  create(data: unknown) {
    return prisma.venue.create({ data: data as Prisma.VenueCreateInput });
  }

  update(id: string, data: unknown) {
    return prisma.venue.update({
      where: { id },
      data: data as Prisma.VenueUpdateInput,
    });
  }

  remove(id: string) {
    return prisma.venue.delete({ where: { id } });
  }
}
