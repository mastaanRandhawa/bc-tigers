import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

@Injectable()
export class MediaService {
  findAll(params?: { tournamentId?: string; divisionId?: string }) {
    return prisma.media.findMany({
      where: {
        ...(params?.tournamentId ? { tournament_id: params.tournamentId } : {}),
        ...(params?.divisionId ? { division_id: params.divisionId } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  create(data: unknown) {
    return prisma.media.create({ data: data as Prisma.MediaCreateInput });
  }

  remove(id: string) {
    return prisma.media.delete({ where: { id } });
  }
}
