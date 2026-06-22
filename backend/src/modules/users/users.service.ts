import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';

/** Fields an admin may set via PATCH /users/:id. Excludes role, password_hash, id. */
const USER_UPDATE_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'profile_image',
  'active',
] as const;

const SELECT = {
  id: true,
  first_name: true,
  last_name: true,
  email: true,
  role: true,
  phone: true,
  profile_image: true,
  active: true,
  approved: true,
  created_at: true,
  updated_at: true,
  coached_team: {
    select: { id: true, name: true },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  findAll(params?: {
    page?: number;
    limit?: number;
    role?: UserRole;
    approved?: boolean;
  }) {
    const { page = 1, limit = 20, role, approved } = params ?? {};
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (approved !== undefined) where.approved = approved;

    return prisma.user.findMany({
      where,
      select: SELECT,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async create(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already in use');

    const role = data.role ?? 'ADMIN';
    const password_hash = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password_hash,
        phone: data.phone,
        role,
        approved: role === 'ADMIN',
        active: role === 'ADMIN',
      },
      select: SELECT,
    });
  }

  async update(id: string, data: unknown) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    const input = pickAllowed<Prisma.UserUpdateInput>(data, USER_UPDATE_FIELDS);
    return prisma.user.update({
      where: { id },
      data: input,
      select: SELECT,
    });
  }

  async approve(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'COACH') {
      throw new BadRequestException('Only coach accounts can be approved');
    }

    return prisma.user.update({
      where: { id },
      data: { approved: true, active: true },
      select: SELECT,
    });
  }

  async resetPassword(id: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const password_hash = await bcrypt.hash(password, 12);
    return prisma.user.update({
      where: { id },
      data: { password_hash },
      select: SELECT,
    });
  }

  remove(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
