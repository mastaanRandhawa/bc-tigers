import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

@Injectable()
export class AnnouncementsService {
  findAll(params?: { tournamentId?: string; limit?: number }) {
    const { limit = 50 } = params ?? {};
    return prisma.announcement.findMany({
      where: params?.tournamentId ? { tournament_id: params.tournamentId } : undefined,
      orderBy: { created_at: 'desc' },
      take: limit,
      include: { tournament: { select: { id: true, name: true, slug: true } } },
    });
  }

  create(data: {
    title: string;
    message: string;
    type?: string;
    tournament_id?: string | null;
  }) {
    return prisma.announcement.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type ?? 'ANNOUNCEMENT',
        tournament_id: data.tournament_id ?? null,
      },
      include: { tournament: { select: { id: true, name: true, slug: true } } },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      message?: string;
      type?: string;
      tournament_id?: string | null;
    },
  ) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Announcement not found');
    return prisma.announcement.update({
      where: { id },
      data: data as Prisma.AnnouncementUpdateInput,
      include: { tournament: { select: { id: true, name: true, slug: true } } },
    });
  }

  async remove(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Announcement not found');
    await prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted.' };
  }
}
