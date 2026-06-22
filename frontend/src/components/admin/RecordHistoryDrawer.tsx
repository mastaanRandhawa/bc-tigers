import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import QueryState from '@/components/shared/QueryState';
import { useRecordHistory, type HistoryEntity } from '@/hooks/useRecordHistory';
import { formatDate } from '@/lib/utils';
import { RotateCcw, Undo2, ArrowRight } from 'lucide-react';
import type { RecordVersion } from '@/types';

interface RecordHistoryDrawerProps {
  entity: HistoryEntity;
  recordId?: string;
  recordLabel?: string;
  isDeleted?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreRecord?: () => void;
  onRestoreVersion?: (versionId: string) => void;
  busy?: boolean;
}

const ACTION_VARIANT: Record<string, 'default' | 'success' | 'live'> = {
  CREATE: 'success',
  UPDATE: 'default',
  DELETE: 'live',
  RESTORE: 'success',
  RESTORE_VERSION: 'success',
};

function fmtValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '∅';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

function actorName(v: RecordVersion): string {
  if (!v.user) return 'System';
  return `${v.user.first_name} ${v.user.last_name}`.trim() || v.user.email;
}

export function RecordHistoryDrawer({
  entity,
  recordId,
  recordLabel,
  isDeleted,
  open,
  onOpenChange,
  onRestoreRecord,
  onRestoreVersion,
  busy,
}: RecordHistoryDrawerProps) {
  const { data: versions = [], isLoading, isError, refetch } = useRecordHistory(
    entity,
    recordId,
    open,
  );

  const latestVersion = versions[0]?.version;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xl w-full">
        <SheetHeader>
          <SheetTitle>{entity} History</SheetTitle>
          <SheetDescription>
            {recordLabel
              ? `Immutable change history for “${recordLabel}”`
              : 'Immutable change history'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {isDeleted && onRestoreRecord && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                This record is deleted (decommissioned). It is hidden from public
                views but fully preserved.
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={onRestoreRecord}
                className="shrink-0"
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore
              </Button>
            </div>
          )}

          <QueryState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            isEmpty={versions.length === 0}
            emptyMessage="No version history yet for this record."
          >
            <ol className="relative space-y-4 border-l border-border pl-4">
              {versions.map((v) => {
                const fields = v.changed_fields ?? [];
                const oldV = (v.old_values ?? {}) as Record<string, unknown>;
                const newV = (v.new_values ?? {}) as Record<string, unknown>;
                const isLatest = v.version === latestVersion;
                return (
                  <li key={v.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-border bg-card" />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          v{v.version}
                        </span>
                        <Badge variant={ACTION_VARIANT[v.action] ?? 'default'}>
                          {v.action.replace(/_/g, ' ')}
                        </Badge>
                        {isLatest && (
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(v.created_at)} · {actorName(v)}
                      </p>

                      {fields.length > 0 ? (
                        <div className="space-y-1 rounded-md bg-muted/40 p-2">
                          {fields.map((f) => (
                            <div key={f} className="text-[11px] leading-relaxed">
                              <span className="font-medium text-foreground">{f}</span>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <span className="line-through opacity-70">
                                  {fmtValue(oldV[f])}
                                </span>
                                <ArrowRight className="h-3 w-3 shrink-0" />
                                <span className="text-foreground">
                                  {fmtValue(newV[f])}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-muted-foreground">
                          No field changes recorded.
                        </p>
                      )}

                      {!isLatest && onRestoreVersion && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => onRestoreVersion(v.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <Undo2 className="mr-1 h-3 w-3" /> Restore this version
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </QueryState>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
