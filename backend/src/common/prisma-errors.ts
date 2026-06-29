import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Map common Prisma errors to HTTP exceptions with readable messages. */
export function handlePrismaError(err: unknown, context: string): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      throw new ConflictException(`${context}: a record with this ${target} already exists`);
    }
    if (err.code === 'P2003') {
      throw new BadRequestException(
        `${context}: cannot complete because related data is still linked`,
      );
    }
    if (err.code === 'P2025') {
      throw new NotFoundException(`${context}: record not found`);
    }
  }
  throw err;
}
