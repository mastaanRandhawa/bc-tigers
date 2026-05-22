import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText } from '@/lib/search-text';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import MatchCard from '@/components/MatchCard';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionVenue } from '@/hooks/useDivisionResources';
import { MapPin } from 'lucide-react';

export default function DivisionVenueDetailPage() {
  const { venueSlug = '' } = useParams();
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: venue, isLoading, isError, refetch } = useDivisionVenue(
    tournamentSlug,
    divisionSlug,
    venueSlug,
  );

  const matches = venue?.matches ?? [];
  const getMatchText = useCallback((m: (typeof matches)[0]) => matchSearchText(m), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(matches, getMatchText);

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      isEmpty={!venue}
      onRetry={() => refetch()}
      emptyMessage="Venue not found for this division."
    >
      {venue && (
        <div className="space-y-5">
          <div
            className="overflow-hidden rounded-xl p-6 text-white shadow-sm"
            style={{ backgroundColor: 'var(--division-primary)' }}
          >
            <MapPin className="mb-2 h-6 w-6" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight font-display">{venue.name}</h1>
            <p className="mt-2 text-sm text-white/85">{venue.address}</p>
            {venue.city && <p className="text-sm text-white/75">{venue.city}</p>}
          </div>

          <Section>
            <SectionHeader title="Matches at this venue" />
            {matches.length > 3 && (
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search matches…"
                className="mb-4"
              />
            )}
            {matches.length > 0 ? (
              hasQuery && filtered.length === 0 ? (
                <SearchEmpty query={debouncedSearch} entityLabel="matches" />
              ) : (
              <div className="divide-y divide-border">
                {filtered.map((m) => (
                  <MatchCard key={m.id} match={m} flat />
                ))}
              </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">No matches at this venue.</p>
            )}
          </Section>
        </div>
      )}
    </QueryState>
  );
}
