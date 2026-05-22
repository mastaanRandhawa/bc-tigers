import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '@/components/ui/sheet';
import { useAuditLog } from '@/hooks/useAuditLog';
import QueryState from '@/components/shared/QueryState';
import { formatDate } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';

interface AuditLogDrawerProps {
  userId?: string;
  entity?: string;
  entityId?: string;
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDrawer({
  userId,
  entity,
  entityId,
  title = 'Audit Trail',
  open,
  onOpenChange,
}: AuditLogDrawerProps) {
  const { data: logs = [], isLoading, isError, refetch } = useAuditLog(
    open ? { userId, entity, entityId, limit: 50 } : undefined,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-lg w-full">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Recent actions recorded in the system
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <QueryState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            isEmpty={logs.length === 0}
            emptyMessage="No audit records found."
          >
            <ol className="relative border-l border-border pl-4 space-y-4">
              {logs.map((log) => (
                <li key={log.id} className="relative">
                  <span className="absolute -left-[17px] top-1 h-3 w-3 rounded-full border-2 border-border bg-card" />
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.created_at)}
                      {log.user && (
                        <> · {log.user.first_name} {log.user.last_name}</>
                      )}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded mr-1.5">
                        {log.action}
                      </span>
                      {log.entity}
                      {log.entity_id && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          #{log.entity_id.slice(0, 8)}
                        </span>
                      )}
                    </p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="mt-1 overflow-x-auto rounded bg-muted/50 p-2 text-[11px] text-muted-foreground">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </QueryState>

          {logs.length === 0 && !isLoading && !isError && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No audit records yet.</p>
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
