import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

@Injectable()
export class AnnouncementsService {
  findAll() {
    return prisma.announcement.findMany({ orderBy: { published_at: 'desc' } });
  }

  async findOne(slug: string) {
    const item = await prisma.announcement.findUnique({ where: { slug } });
    if (!item) throw new NotFoundException('Announcement not found');
    return item;
  }

  create(data: unknown) {
    return prisma.announcement.create({ data: data as Prisma.AnnouncementCreateInput });
  }

  update(id: string, data: unknown) {
    return prisma.announcement.update({
      where: { id },
      data: data as Prisma.AnnouncementUpdateInput,
    });
  }

  remove(id: string) {
    return prisma.announcement.delete({ where: { id } });
  }
}
