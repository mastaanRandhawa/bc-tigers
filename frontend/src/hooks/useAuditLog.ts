import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '@/services/audit-log.service';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';

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

/**
 * Global audit feed for the admin Activity Log page. Unlike {@link useAuditLog}
 * it is always enabled (admin only) and supports action/source filters.
 */
export function useAuditFeed(params?: {
  entity?: string;
  action?: string;
  source?: string;
  userId?: string;
  limit?: number;
}) {
  const canAdmin = useCanAdminEdit();
  return useQuery({
    queryKey: ['audit-logs', 'feed', params ?? {}],
    queryFn: async () => (await auditLogService.getAll(params)).data,
    enabled: canAdmin,
  });
}
