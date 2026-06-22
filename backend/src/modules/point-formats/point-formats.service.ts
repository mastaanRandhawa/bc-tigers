import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';

const POINT_FORMAT_FIELDS = [
  'name',
  'slug',
  'description',
  'is_system',
  'win',
  'draw',
  'loss',
  'bonuses_enabled',
  'shutout_bonus',
  'goal_bonus_per_goal',
  'goal_bonus_cap',
  'apply_bonuses_on_loss',
  'forfeit_win_score',
  'forfeit_loss_score',
  'forfeit_award_bonuses',
  'tiebreakers',
] as const;

@Injectable()
export class PointFormatsService {
  findAll() {
    return prisma.pointFormat.findMany({
      orderBy: [{ is_system: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { divisions: true } } },
    });
  }

  async findOne(id: string) {
    const format = await prisma.pointFormat.findUnique({
      where: { id },
      include: { _count: { select: { divisions: true } } },
    });
    if (!format) throw new NotFoundException('Point format not found');
    return format;
  }

  create(data: unknown) {
    return prisma.pointFormat.create({
      data: pickAllowed<Prisma.PointFormatUncheckedCreateInput>(
        data,
        POINT_FORMAT_FIELDS,
      ),
    });
  }

  update(id: string, data: unknown) {
    return prisma.pointFormat.update({
      where: { id },
      data: pickAllowed<Prisma.PointFormatUncheckedUpdateInput>(
        data,
        POINT_FORMAT_FIELDS,
      ),
    });
  }

  async remove(id: string) {
    const format = await prisma.pointFormat.findUnique({
      where: { id },
      include: { _count: { select: { divisions: true } } },
    });
    if (!format) throw new NotFoundException('Point format not found');
    if (format._count.divisions > 0) {
      throw new ConflictException(
        'Cannot delete a point format assigned to one or more divisions',
      );
    }
    return prisma.pointFormat.delete({ where: { id } });
  }
}
