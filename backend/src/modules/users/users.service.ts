import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, UserRole } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { ensureRoleProfile } from '../../common/ensure-role-profile';

const SELECT = {
  id: true,
  first_name: true,
  last_name: true,
  email: true,
  role: true,
  phone: true,
  profile_image: true,
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
    });
  }

  findOne(id: string) {
    return prisma.user.findUniqueOrThrow({ where: { id }, select: SELECT });
  }

  async update(id: string, data: unknown) {
    const input = data as Prisma.UserUpdateInput & { role?: UserRole };
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    const user = await prisma.user.update({
      where: { id },
      data: input,
      select: SELECT,
    });

    const newRole = input.role ?? existing.role;
    if (newRole !== existing.role || ['COACH', 'PLAYER', 'REFEREE'].includes(newRole)) {
      if (newRole === 'COACH' || newRole === 'PLAYER' || newRole === 'REFEREE') {
        await ensureRoleProfile(id, newRole, {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
        });
      }
    }

    return user;
  }

  remove(id: string) {
    return prisma.user.delete({ where: { id } });
  }

  async linkEntity(
    id: string,
    data: { entity_type: 'player' | 'coach' | 'referee'; entity_id: string },
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (data.entity_type === 'player') {
      await prisma.player.update({
        where: { id: data.entity_id },
        data: { user_id: id },
      });
    } else if (data.entity_type === 'coach') {
      await prisma.coach.update({
        where: { id: data.entity_id },
        data: { user_id: id },
      });
    } else {
      await prisma.referee.update({
        where: { id: data.entity_id },
        data: { user_id: id },
      });
    }

    return this.findOne(id);
  }
}
