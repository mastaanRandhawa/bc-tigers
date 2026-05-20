import { useParams } from 'react-router-dom';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
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

  return (
    <PageContent innerClassName="max-w-4xl">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!venue}
        onRetry={() => refetch()}
        emptyMessage="Venue not found for this division."
      >
        {venue && (
          <>
            <div className="rounded-[2rem] bg-primary text-white p-8 mb-8">
              <MapPin className="w-8 h-8 mb-3" />
              <h1 className="text-3xl font-black uppercase">{venue.name}</h1>
              <p className="text-white/80 mt-2">{venue.address}</p>
              <p className="text-white/70 text-sm">{venue.city}</p>
            </div>
            <h2 className="font-black uppercase mb-4">Division Matches at this Venue</h2>
            <div className="space-y-3">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </>
        )}
      </QueryState>
    </PageContent>
  );
}
