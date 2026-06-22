import { Injectable } from '@nestjs/common';
import prisma from '../../prisma/prisma';

@Injectable()
export class FieldsService {
  getByVenue(venueId: string) {
    return prisma.field.findMany({ where: { venue_id: venueId } });
  }

  create(
    venueId: string,
    data: { name: string; surface?: string; capacity?: number },
  ) {
    return prisma.field.create({ data: { ...data, venue_id: venueId } });
  }

  async update(
    id: string,
    data: { name?: string; surface?: string; capacity?: number },
  ) {
    await prisma.field.findUniqueOrThrow({ where: { id } });
    return prisma.field.update({ where: { id }, data });
  }

  async remove(id: string) {
    await prisma.field.findUniqueOrThrow({ where: { id } });
    return prisma.field.delete({ where: { id } });
  }
}
