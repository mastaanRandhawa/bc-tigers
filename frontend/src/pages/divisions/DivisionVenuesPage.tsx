import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import ResourceList from '@/components/shared/ResourceList';
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
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(venues, getText);

  return (
    <>
      <DivisionPageHeader
        title="Venues"
        subtitle="Locations used for matches in this division"
      />
      <ResourceList
        items={filtered}
        totalCount={venues.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search venues…"
        debouncedSearch={debouncedSearch}
        hasQuery={hasQuery}
        entityLabel="venues"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No venues used in this division yet."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((venue) => (
            <Link
              key={venue.id}
              to={`${basePath}/venues/${venue.slug}`}
              className="rounded-xl bg-card p-4 shadow-sm border border-border transition-all duration-200 hover:shadow-md hover:border-primary/30"
            >
              <MapPin
                className="mb-2 h-5 w-5"
                style={{ color: 'var(--division-primary)' }}
                aria-hidden
              />
              <h3 className="font-semibold text-foreground">{venue.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{venue.address}</p>
              {venue.city && <p className="mt-0.5 text-xs text-muted-foreground/60">{venue.city}</p>}
            </Link>
          ))}
        </div>
      </ResourceList>
    </>
  );
}
