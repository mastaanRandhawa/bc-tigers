import apiClient from '@/lib/api-client';
import type { AuditLog } from '@/types';

export const auditLogService = {
  getAll: (params?: { userId?: string; entity?: string; entityId?: string; limit?: number }) =>
    apiClient.get<AuditLog[]>('/audit-logs', { params }),
};
