import { Link } from 'react-router-dom';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionVenues } from '@/hooks/useDivisionResources';
import { MapPin } from 'lucide-react';

export default function DivisionVenuesPage() {
  const { tournamentSlug, divisionSlug, basePath } = useDivisionRoute();
  const { data: venues = [], isLoading, isError, refetch } = useDivisionVenues(
    tournamentSlug,
    divisionSlug,
  );

  return (
    <PageContent>
      <h2 className="text-xl font-black uppercase mb-6">Venues</h2>
      <p className="text-sm text-gray-700 mb-6">
        Locations used for matches in this division.
      </p>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={venues.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No venues used in this division yet."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {venues.map((venue) => (
            <Link
              key={venue.id}
              to={`${basePath}/venues/${venue.slug}`}
              className="rounded-[2rem] border-2 border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow"
            >
              <MapPin className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-black uppercase">{venue.name}</h3>
              <p className="text-sm text-gray-700 mt-1">{venue.address}</p>
              <p className="text-xs text-gray-600 mt-2">{venue.city}</p>
            </Link>
          ))}
        </div>
      </QueryState>
    </PageContent>
  );
}
