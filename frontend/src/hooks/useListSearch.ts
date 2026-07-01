import { useMemo, useState } from 'react';
import { normalizeSearch, textIncludes } from '@/lib/search-text';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function useListSearch<T>(
  items: T[],
  getSearchText: (item: T) => string,
  initialSearch = '',
  debounceMs = 250,
) {
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search, debounceMs);

  const filtered = useMemo(() => {
    const q = normalizeSearch(debouncedSearch);
    if (!q) return items;
    return items.filter((item) => textIncludes(getSearchText(item), q));
  }, [items, debouncedSearch, getSearchText]);

  const hasQuery = normalizeSearch(debouncedSearch).length > 0;

  return { search, setSearch, filtered, debouncedSearch, hasQuery };
}
