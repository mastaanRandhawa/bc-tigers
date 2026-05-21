import { useCallback, useMemo, useState } from 'react';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { divisionSearchText } from '@/lib/search-text';
import SectionBlock from '@/components/design-system/SectionBlock';
import FilterBar from '@/components/design-system/FilterBar';
import EmptyStatePanel from '@/components/design-system/EmptyStatePanel';
import DivisionCard from '@/components/tournaments/DivisionCard';
import { useTournamentRoute } from '@/context/TournamentContext';
import { Flag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortKey = 'name' | 'teams';

export default function TournamentDivisionsPage() {
  const { tournament, tournamentSlug } = useTournamentRoute();
  const divisions = tournament.divisions ?? [];
  const [sort, setSort] = useState<SortKey>('name');
  const [formatFilter, setFormatFilter] = useState<string | null>(null);

  const formats = useMemo(
    () => [...new Set(divisions.map((d) => d.format).filter(Boolean))],
    [divisions],
  );

  const getDivisionText = useCallback((d: (typeof divisions)[0]) => divisionSearchText(d), []);
  const {
    search,
    setSearch,
    filtered: searched,
    debouncedSearch,
    hasQuery,
  } = useListSearch(divisions, getDivisionText);

  const filtered = useMemo(() => {
    let list = [...searched];
    if (formatFilter) list = list.filter((d) => d.format === formatFilter);
    list.sort((a, b) => {
      if (sort === 'teams') {
        return (b.teams?.length ?? 0) - (a.teams?.length ?? 0);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [searched, sort, formatFilter]);

  const chips = formats.map((f) => ({
    id: f,
    label: f,
    active: formatFilter === f,
    onClick: () => setFormatFilter(formatFilter === f ? null : f),
  }));

  return (
    <SectionBlock title="All divisions" subtitle="Browse competitions in this tournament" variant="flat">
      {divisions.length > 0 && (
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search divisions…"
          chips={chips.length > 1 ? chips : undefined}
          sort={
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-9 w-[140px] text-xs">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="teams">Team count</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      )}

      {hasQuery && filtered.length === 0 ? (
        <SearchEmpty query={debouncedSearch} entityLabel="divisions" />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((div) => (
            <DivisionCard
              key={div.id}
              division={{ ...div, tournament }}
              tournamentSlug={tournamentSlug}
              variant="grid"
            />
          ))}
        </div>
      ) : divisions.length === 0 ? (
        <EmptyStatePanel
          icon={Flag}
          title="No divisions yet"
          description="Divisions will appear here once they are configured for this tournament."
        />
      ) : null}
    </SectionBlock>
  );
}
