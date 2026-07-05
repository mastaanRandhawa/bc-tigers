import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  History,
  RotateCcw,
} from 'lucide-react';
import type { RecordScope } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/** Returns an array of page numbers and '…' ellipsis markers for a compact paginator. */
function buildPageWindows(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '…')[] = [];
  const addPage = (n: number) => pages.push(n);
  const addEllipsis = () => {
    if (pages[pages.length - 1] !== '…') pages.push('…');
  };

  addPage(1);
  if (current > 4) addEllipsis();

  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  for (let p = start; p <= end; p++) addPage(p);

  if (current < total - 3) addEllipsis();
  addPage(total);

  return pages;
}

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface AdminTableProps<T extends { id: string }> {
  title: string;
  data: T[];
  columns: Column<T>[];
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  /** Search nested fields (e.g. team names on matches) */
  getSearchText?: (row: T) => string;
  searchPlaceholder?: string;
  // ─── Audit / soft-delete extensions ───
  /** Open the version/audit history drawer for a row. */
  onHistory?: (row: T) => void;
  /** Restore a soft-deleted row. */
  onRestore?: (row: T) => void;
  /** Permanently purge a soft-deleted row (admin only). */
  onPurge?: (row: T) => void;
  /** Whether a row is soft-deleted (drives Restore/Purge vs Edit/Delete). */
  getIsDeleted?: (row: T) => boolean;
  /** Active/Deleted/All scope toggle (rendered when onScopeChange provided). */
  scope?: RecordScope;
  onScopeChange?: (scope: RecordScope) => void;
  /** Card layout for viewports below `md` (table still used on desktop). */
  mobileRender?: (row: T) => React.ReactNode;
  /** Optional row rendered below the title bar (e.g. list filters). */
  filterBar?: React.ReactNode;
  /** Reset pagination when filters change. */
  filtersKey?: string;
}

export default function AdminTable<T extends { id: string }>({
  title,
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  searchable = true,
  searchKeys = [],
  getSearchText,
  searchPlaceholder = 'Search…',
  onHistory,
  onRestore,
  onPurge,
  getIsDeleted,
  scope,
  onScopeChange,
  mobileRender,
  filterBar,
  filtersKey,
}: AdminTableProps<T>) {
  const hasActions = !!(onEdit || onDelete || onHistory || onRestore || onPurge);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  const q = search.trim().toLowerCase();
  const filtered =
    q && (getSearchText || searchKeys.length > 0)
      ? data.filter((row) => {
          if (getSearchText) return getSearchText(row).toLowerCase().includes(q);
          return searchKeys.some((key) =>
            String(row[key] ?? '').toLowerCase().includes(q),
          );
        })
      : data;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const renderActions = (row: T) => {
    const deleted = getIsDeleted?.(row) ?? false;
    return (
      <div className="flex items-center justify-end gap-0.5">
        {onHistory && (
          <button
            type="button"
            onClick={() => onHistory(row)}
            className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 text-muted-foreground hover:text-primary hover:bg-primary-muted rounded-lg transition-colors touch-manipulation"
            aria-label="History"
            title="View history"
          >
            <History className="w-4 h-4" />
          </button>
        )}
        {deleted ? (
          <>
            {onRestore && (
              <button
                type="button"
                onClick={() => onRestore(row)}
                className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
                aria-label="Restore"
                title="Restore"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {onPurge && (
              <button
                type="button"
                onClick={() => onPurge(row)}
                className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                aria-label="Purge"
                title="Permanently delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 text-muted-foreground hover:text-primary hover:bg-primary-muted rounded-lg transition-colors touch-manipulation"
                aria-label="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(row)}
                className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-border">
        <h2 className="font-semibold text-foreground text-base sm:text-lg">{title}</h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onScopeChange && (
            <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
              {(['active', 'deleted', 'all'] as RecordScope[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onScopeChange(s)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                    (scope ?? 'active') === s
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {searchable && (
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10 sm:h-9"
              />
            </div>
          )}
          {onAdd && (
            <Button onClick={onAdd} size="sm" className="flex-shrink-0 h-10 sm:h-9">
              <Plus className="w-4 h-4" /> Add New
            </Button>
          )}
        </div>
      </div>

      {filterBar && (
        <div className="border-b border-border px-4 py-3 sm:px-5">
          {filterBar}
        </div>
      )}

      {paginated.length === 0 ? (
        <EmptyState title="No records found" message="Try adjusting your search or add a new record." />
      ) : (
        <>
          {mobileRender && (
            <div className="divide-y divide-border md:hidden">
              {paginated.map((row) => {
                const deleted = getIsDeleted?.(row) ?? false;
                return (
                  <div key={row.id} className={cn('p-3.5', deleted && 'opacity-60')}>
                    {mobileRender(row)}
                    {hasActions && (
                      <div className="mt-3 flex items-center justify-end border-t border-border/60 pt-2">
                        {renderActions(row)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className={cn('overflow-x-auto', mobileRender && 'hidden md:block')}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {columns.map((col) => (
                    <TableHead key={col.key} className={col.className}>
                      {col.label}
                    </TableHead>
                  ))}
                  {hasActions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((row) => {
                  const deleted = getIsDeleted?.(row) ?? false;
                  return (
                    <TableRow key={row.id} className={cn(deleted && 'opacity-60')}>
                      {columns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                          {col.render
                            ? col.render(row)
                            : (
                              <span className="break-words">
                                {String((row as Record<string, unknown>)[col.key] ?? '—')}
                              </span>
                            )}
                        </TableCell>
                      ))}
                      {hasActions && (
                        <TableCell className="text-right">
                          {renderActions(row)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 touch-manipulation"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {buildPageWindows(page, totalPages).map((item, i) =>
              item === '…' ? (
                <span key={`ellipsis-${i}`} className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-xs text-muted-foreground select-none">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item as number)}
                  className={cn(
                    'w-8 h-8 sm:w-7 sm:h-7 rounded-md text-xs font-semibold touch-manipulation',
                    item === page ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 touch-manipulation"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
