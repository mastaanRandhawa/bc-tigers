import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

@Injectable()
export class AuditLogService {
  findAll(params?: {
    userId?: string;
    entity?: string;
    entityId?: string;
    limit?: number;
  }) {
    const { limit = 50 } = params ?? {};
    return prisma.auditLog.findMany({
      where: {
        ...(params?.userId ? { user_id: params.userId } : {}),
        ...(params?.entity ? { entity: params.entity } : {}),
        ...(params?.entityId ? { entity_id: params.entityId } : {}),
      },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  log(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.auditLog.create({
      data: {
        user_id: params.userId,
        action: params.action,
        entity: params.entity,
        entity_id: params.entityId,
        metadata: params.metadata,
      },
    });
  }
}
