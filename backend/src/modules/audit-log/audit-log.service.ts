import { Injectable } from '@nestjs/common';
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
}
