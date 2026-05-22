import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '@/services/audit-log.service';

export function useAuditLog(params?: {
  userId?: string;
  entity?: string;
  entityId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['audit-logs', params ?? {}],
    queryFn: async () => (await auditLogService.getAll(params)).data,
    enabled: !!(params?.userId || params?.entity || params?.entityId),
  });
}
