import { Injectable } from '@nestjs/common';
import prisma from '../../prisma/prisma';

@Injectable()
export class ContactService {
  create(data: { name: string; email: string; subject: string; message: string }) {
    return prisma.contactMessage.create({ data });
  }

  findAll() {
    return prisma.contactMessage.findMany({ orderBy: { created_at: 'desc' } });
  }

  markRead(id: string) {
    return prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
  }
}
