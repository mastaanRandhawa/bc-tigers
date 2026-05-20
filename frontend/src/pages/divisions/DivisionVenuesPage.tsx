import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionVenues } from '@/hooks/useDivisionResources';
import { useListSearch } from '@/hooks/useListSearch';
import { venueSearchText } from '@/lib/search-text';
import { MapPin } from 'lucide-react';

export default function DivisionVenuesPage() {
  const { tournamentSlug, divisionSlug, basePath } = useDivisionRoute();
  const { data: venues = [], isLoading, isError, refetch } = useDivisionVenues(
    tournamentSlug,
    divisionSlug,
  );

  const getText = useCallback((v: (typeof venues)[0]) => venueSearchText(v), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    venues,
    getText,
  );

  return (
    <>
      <DivisionPageHeader
        title="Venues"
        subtitle="Locations used for matches in this division"
      />
      {venues.length > 0 && (
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search venues…"
          className="mb-5 max-w-md"
        />
      )}
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={venues.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No venues used in this division yet."
      >
        {hasQuery && filtered.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel="venues" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((venue) => (
              <Link
                key={venue.id}
                to={`${basePath}/venues/${venue.slug}`}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-border/60 transition-all duration-200 hover:shadow-md hover:ring-zinc-300"
              >
                <MapPin
                  className="mb-2 h-5 w-5"
                  style={{ color: 'var(--division-primary)' }}
                  aria-hidden
                />
                <h3 className="font-semibold text-foreground">{venue.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{venue.address}</p>
                {venue.city && <p className="mt-0.5 text-xs text-zinc-400">{venue.city}</p>}
              </Link>
            ))}
          </div>
        )}
      </QueryState>
    </>
  );
}
