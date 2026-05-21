import type { ReactNode } from 'react';
import SearchField from '@/components/shared/SearchField';
import { cn } from '@/lib/utils';

export interface FilterChip {
  id: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface FilterBarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  chips?: FilterChip[];
  sort?: ReactNode;
  className?: string;
}

export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  chips,
  sort,
  className,
}: FilterBarProps) {
  const showSearch = onSearchChange !== undefined;

  return (
    <div className={cn('mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {showSearch && (
          <SearchField
            value={search ?? ''}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="max-w-md"
          />
        )}
        {chips && chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filters">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.onClick}
                aria-pressed={chip.active}
                className={cn(
                  'border-2 px-2.5 py-1 text-xs font-black uppercase tracking-wide transition-all duration-200 ease-out press-scale',
                  chip.active
                    ? 'border-foreground bg-foreground text-white shadow-hard-sm'
                    : 'border-foreground bg-white text-foreground/70 shadow-hard-sm hover:shadow-hard-md hover:-translate-x-0.5 hover:-translate-y-0.5',
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {sort && <div className="shrink-0">{sort}</div>}
    </div>
  );
}
