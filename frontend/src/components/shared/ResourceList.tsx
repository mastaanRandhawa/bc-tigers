import type { ReactNode } from 'react';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import type { QueryStateVariant } from '@/components/shared/QueryState';

interface ResourceListProps<T> {
  /** Items after filtering */
  items: T[];
  /** Total items before filtering (used to decide whether to show SearchField) */
  totalCount?: number;
  /** Show SearchField when totalCount exceeds this threshold (default: 3) */
  searchThreshold?: number;
  /** Current search query */
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Debounced query used for SearchEmpty display */
  debouncedSearch?: string;
  hasQuery?: boolean;
  entityLabel?: string;
  /** Loading / error state */
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  loadingVariant?: QueryStateVariant;
  /** Rendered list/grid when there are results */
  children: ReactNode;
  /** Optional content above the search field (e.g. filters) */
  headerSlot?: ReactNode;
  className?: string;
}

/**
 * ResourceList — eliminates the repeated pattern across ~15 pages:
 *
 *   <QueryState isLoading isError isEmpty onRetry>
 *     {items.length > threshold && <SearchField />}
 *     {hasQuery && filtered.length === 0 ? <SearchEmpty /> : <Grid />}
 *   </QueryState>
 *
 * Usage:
 *   const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(items, getText);
 *   <ResourceList search={search} onSearchChange={setSearch} items={filtered}
 *     totalCount={items.length} debouncedSearch={debouncedSearch} hasQuery={hasQuery}>
 *     <Grid of cards />
 *   </ResourceList>
 */
export default function ResourceList<T>({
  items,
  totalCount,
  searchThreshold = 3,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  debouncedSearch = search,
  hasQuery = search.length > 0,
  entityLabel = 'items',
  isLoading,
  isError,
  onRetry,
  emptyMessage,
  loadingVariant,
  children,
  headerSlot,
  className,
}: ResourceListProps<T>) {
  const count = totalCount ?? items.length;
  const showSearch = count > searchThreshold || (hasQuery && count === 0);

  return (
    <div className={className}>
      {headerSlot}
      {showSearch && (
        <div className="mb-4">
          <SearchField
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="max-w-md"
          />
        </div>
      )}
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!hasQuery && items.length === 0}
        onRetry={onRetry}
        emptyMessage={emptyMessage}
        variant={loadingVariant}
      >
        {hasQuery && items.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel={entityLabel} />
        ) : (
          <>{children}</>
        )}
      </QueryState>
    </div>
  );
}
