import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

@Injectable()
export class RefereesService {
  findAll() {
    return prisma.referee.findMany();
  }
  findOne(id: string) {
    return prisma.referee.findUniqueOrThrow({ where: { id } });
  }
  create(data: unknown) {
    return prisma.referee.create({ data: data as Prisma.RefereeCreateInput });
  }
  update(id: string, data: unknown) {
    return prisma.referee.update({
      where: { id },
      data: data as Prisma.RefereeUpdateInput,
    });
  }
  remove(id: string) {
    return prisma.referee.delete({ where: { id } });
  }
}
