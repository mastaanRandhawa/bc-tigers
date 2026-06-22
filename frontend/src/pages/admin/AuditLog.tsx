import { Fragment, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import QueryState from '@/components/shared/QueryState';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RecordHistoryDrawer } from '@/components/admin/RecordHistoryDrawer';
import { useAuditFeed } from '@/hooks/useAuditLog';
import { useUsers } from '@/hooks/useUsers';
import type { HistoryEntity } from '@/hooks/useRecordHistory';
import { formatDate, formatTime } from '@/lib/date';
import { ArrowRight, ChevronDown, ChevronRight, History } from 'lucide-react';
import type { AuditLog } from '@/types';

const ACTION_OPTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'RESTORE_VERSION',
  'PURGE',
  'LOGIN',
  'LOGOUT',
  'PASSWORD_RESET',
  'BRACKET_GENERATION',
  'SCHEDULE_GENERATION',
];
const ENTITY_OPTIONS = [
  'Tournament',
  'Team',
  'Division',
  'User',
  'Announcement',
  'Auth',
];
const SOURCE_OPTIONS = ['Web', 'API', 'Mobile', 'BackgroundJob'];

const HISTORY_ENTITIES = new Set<HistoryEntity>(['Tournament', 'Team']);

const ACTION_VARIANT: Record<
  string,
  'default' | 'success' | 'destructive' | 'warning' | 'live'
> = {
  CREATE: 'success',
  UPDATE: 'default',
  DELETE: 'destructive',
  RESTORE: 'success',
  RESTORE_VERSION: 'success',
  PURGE: 'destructive',
  LOGIN: 'default',
  LOGOUT: 'default',
  PASSWORD_RESET: 'warning',
  BRACKET_GENERATION: 'warning',
  SCHEDULE_GENERATION: 'warning',
};

const IGNORED = new Set(['updated_at', 'created_at']);
const TRUNCATE_AT = 120;

function fmt(v: unknown, expanded = false): string {
  if (v === null || v === undefined || v === '') return '∅';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (expanded || s.length <= TRUNCATE_AT) return s;
  return `${s.slice(0, TRUNCATE_AT)}…`;
}

function isTruncated(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return false;
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > TRUNCATE_AT;
}

/** Field names that differ between the previous and new snapshots. */
function changedFields(log: AuditLog): string[] {
  const prev = (log.previous_values ?? {}) as Record<string, unknown>;
  const next = (log.new_values ?? {}) as Record<string, unknown>;
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  return [...keys].filter(
    (k) =>
      !IGNORED.has(k) &&
      JSON.stringify(prev[k] ?? null) !== JSON.stringify(next[k] ?? null),
  );
}

function actorName(log: AuditLog): string {
  if (!log.user) return 'System';
  return `${log.user.first_name} ${log.user.last_name}`.trim() || log.user.email;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}

function FieldDiff({
  field,
  oldVal,
  newVal,
}: {
  field: string;
  oldVal: unknown;
  newVal: unknown;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = isTruncated(oldVal) || isTruncated(newVal);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="min-w-[120px] font-medium text-foreground">{field}</span>
        <span className="text-muted-foreground line-through opacity-70">
          {fmt(oldVal, expanded)}
        </span>
        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="text-foreground">{fmt(newVal, expanded)}</span>
      </div>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-[10px] text-primary hover:underline"
        >
          {expanded ? 'Show less' : 'Show full value'}
        </button>
      )}
    </div>
  );
}

export default function AuditLog() {
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [source, setSource] = useState('');
  const [userId, setUserId] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [historyTarget, setHistoryTarget] = useState<{
    entity: HistoryEntity;
    id: string;
    label: string;
  } | null>(null);

  const { data: users = [] } = useUsers();
  const { data: logs = [], isLoading, isError, refetch } = useAuditFeed({
    action: action || undefined,
    entity: entity || undefined,
    source: source || undefined,
    userId: userId || undefined,
    limit: 200,
  });

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: `${u.first_name} ${u.last_name}`.trim() || u.email,
      })),
    [users],
  );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const rows = useMemo(
    () => logs.map((log) => ({ log, fields: changedFields(log) })),
    [logs],
  );

  const canViewRecordHistory = (log: AuditLog) =>
    !!log.entity_id && HISTORY_ENTITIES.has(log.entity as HistoryEntity);

  return (
    <AdminLayout
      title="Activity Log"
      description="Who modified what, and when — every recorded action across the system."
    >
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
          <FilterSelect label="Action" value={action} onChange={setAction} options={ACTION_OPTIONS} />
          <FilterSelect label="Entity" value={entity} onChange={setEntity} options={ENTITY_OPTIONS} />
          <FilterSelect label="Source" value={source} onChange={setSource} options={SOURCE_OPTIONS} />
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              User
            </span>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">All</option>
              {userOptions.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <span className="ml-auto self-center text-xs text-muted-foreground">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          isEmpty={logs.length === 0}
          emptyMessage="No activity recorded for these filters."
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8" />
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ log, fields }) => {
                  const open = expanded.has(log.id);
                  const prev = (log.previous_values ?? {}) as Record<string, unknown>;
                  const next = (log.new_values ?? {}) as Record<string, unknown>;
                  return (
                    <Fragment key={log.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => toggle(log.id)}
                      >
                        <TableCell className="text-muted-foreground">
                          {open ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <span className="text-foreground">{formatDate(log.created_at)}</span>
                          <span className="ml-1 text-muted-foreground">
                            {formatTime(log.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{actorName(log)}</TableCell>
                        <TableCell>
                          <Badge variant={ACTION_VARIANT[log.action] ?? 'default'}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="text-foreground">{log.entity}</span>
                          {log.entity_id && (
                            <span className="ml-1 font-mono text-muted-foreground">
                              #{log.entity_id.slice(0, 8)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {fields.length > 0
                            ? fields.slice(0, 4).join(', ') +
                              (fields.length > 4 ? ` +${fields.length - 4}` : '')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.source ?? '—'}
                        </TableCell>
                      </TableRow>

                      {open && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="space-y-3 p-2 text-xs">
                              {fields.length > 0 ? (
                                <div className="space-y-2">
                                  {fields.map((f) => (
                                    <FieldDiff
                                      key={f}
                                      field={f}
                                      oldVal={prev[f]}
                                      newVal={next[f]}
                                    />
                                  ))}
                                </div>
                              ) : log.metadata && Object.keys(log.metadata).length > 0 ? (
                                <pre className="overflow-x-auto rounded bg-card p-2 text-[11px] text-muted-foreground">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              ) : (
                                <p className="text-muted-foreground">No field changes recorded.</p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-2">
                                {canViewRecordHistory(log) && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHistoryTarget({
                                        entity: log.entity as HistoryEntity,
                                        id: log.entity_id!,
                                        label: `${log.entity} #${log.entity_id!.slice(0, 8)}`,
                                      });
                                    }}
                                  >
                                    <History className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                                    View record history
                                  </Button>
                                )}
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
                                  {log.source && <span>Source: {log.source}</span>}
                                  {log.ip_address && <span>IP: {log.ip_address}</span>}
                                  {log.request_id && (
                                    <span>Request: {log.request_id.slice(0, 8)}</span>
                                  )}
                                  {log.user_agent && (
                                    <span className="max-w-[28rem] truncate">
                                      UA: {log.user_agent}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </QueryState>
      </Card>

      <RecordHistoryDrawer
        entity={historyTarget?.entity ?? 'Tournament'}
        recordId={historyTarget?.id}
        recordLabel={historyTarget?.label}
        open={!!historyTarget}
        onOpenChange={(open) => {
          if (!open) setHistoryTarget(null);
        }}
      />
    </AdminLayout>
  );
}
