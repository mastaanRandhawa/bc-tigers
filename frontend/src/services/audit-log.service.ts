import apiClient from '@/lib/api-client';
import type { AuditLog, RecordVersion } from '@/types';

export const auditLogService = {
  getAll: (params?: {
    userId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    source?: string;
    limit?: number;
  }) => apiClient.get<AuditLog[]>('/audit-logs', { params }),

  getVersions: (entityType: string, entityId: string) =>
    apiClient.get<RecordVersion[]>('/record-versions', {
      params: { entityType, entityId },
    }),
};
