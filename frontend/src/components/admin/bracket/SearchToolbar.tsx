import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TeamFilter, TeamSort } from './types';

interface SearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: TeamSort;
  onSortChange: (value: TeamSort) => void;
  filter: TeamFilter;
  onFilterChange: (value: TeamFilter) => void;
  totalCount: number;
  unassignedCount: number;
}

const FILTERS: { id: TeamFilter; label: string }[] = [
  { id: 'all', label: 'All teams' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'assigned', label: 'Assigned' },
];

export function SearchToolbar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  filter,
  onFilterChange,
  totalCount,
  unassignedCount,
}: SearchToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search teams by name or city…"
            className="h-10 rounded-xl border-border/80 bg-background pl-9 shadow-[var(--shadow-xs)]"
            aria-label="Search teams"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/30 px-2 py-1">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as TeamSort)}
              className="bg-transparent text-xs font-medium text-foreground focus:outline-none"
              aria-label="Sort teams"
            >
              <option value="unassigned">Unassigned first</option>
              <option value="name">Name A–Z</option>
              <option value="city">City A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-[var(--motion-fast)]',
              filter === item.id
                ? 'border-primary/30 bg-primary/10 text-primary shadow-[var(--shadow-xs)]'
                : 'border-border/80 bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground',
            )}
          >
            {item.label}
            {item.id === 'unassigned' && unassignedCount > 0 ? ` (${unassignedCount})` : ''}
            {item.id === 'all' ? ` (${totalCount})` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
