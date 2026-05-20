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
