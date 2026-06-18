import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

const SELECT = {
  id: true,
  first_name: true,
  last_name: true,
  email: true,
  role: true,
  phone: true,
  profile_image: true,
  active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  findAll(params?: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params ?? {};
    return prisma.user.findMany({
      select: SELECT,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  findOne(id: string) {
    return prisma.user.findUniqueOrThrow({ where: { id }, select: SELECT });
  }

  async update(id: string, data: unknown) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    const input = data as Prisma.UserUpdateInput;
    return prisma.user.update({
      where: { id },
      data: input,
      select: SELECT,
    });
  }

  remove(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
