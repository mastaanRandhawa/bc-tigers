import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
}: AdminTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-border">
        <h2 className="font-semibold text-foreground text-base sm:text-lg">{title}</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
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

      {paginated.length === 0 ? (
        <EmptyState title="No records found" message="Try adjusting your search or add a new record." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.label}
                  </TableHead>
                ))}
                {(onEdit || onDelete) && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
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
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
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
