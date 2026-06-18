import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
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

  async create(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already in use');

    const password_hash = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password_hash,
        phone: data.phone,
        role: 'ADMIN',
      },
      select: SELECT,
    });
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
