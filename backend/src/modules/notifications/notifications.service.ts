import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../prisma/prisma';

@Injectable()
export class NotificationsService {
  findForUser(userId: string) {
    return prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: { tournament: { select: { id: true, name: true, slug: true } } },
    });
  }

  async markRead(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, user_id: userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    });
    return { message: 'All notifications marked as read.' };
  }

  create(data: {
    user_id?: string;
    tournament_id?: string;
    title: string;
    message: string;
    type?: string;
  }) {
    return prisma.notification.create({ data });
  }
}
