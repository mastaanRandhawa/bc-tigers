import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationsService {
  constructor(
    private settingsService: SettingsService,
    private mailService: MailService,
  ) {}

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

  async create(data: {
    user_id?: string;
    tournament_id?: string;
    title: string;
    message: string;
    type?: string;
  }) {
    const notification = await prisma.notification.create({ data });

    const settings = await this.settingsService.getAdmin();
    if (settings.notifications_enabled && data.user_id) {
      const user = await prisma.user.findUnique({
        where: { id: data.user_id },
        select: { email: true },
      });
      if (user?.email) {
        await this.mailService.send({
          to: user.email,
          subject: data.title,
          text: data.message,
        });
      }
    }

    return notification;
  }
}
