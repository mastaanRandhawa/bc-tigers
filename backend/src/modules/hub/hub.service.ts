import { Injectable } from '@nestjs/common';
import prisma from '../../prisma/prisma';

@Injectable()
export class HubService {
  async getHomeFeed() {
    const tournaments = await prisma.tournament.findMany({
      take: 12,
      orderBy: { start_date: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        location: true,
        status: true,
        start_date: true,
        end_date: true,
        logo: true,
        registration_open_date: true,
        registration_close_date: true,
        entry_fee: true,
        _count: { select: { divisions: true } },
      },
    });

    return { tournaments };
  }
}
