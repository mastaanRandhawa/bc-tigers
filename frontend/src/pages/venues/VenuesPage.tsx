import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import DivisionDirectoryCard from '@/components/shared/DivisionDirectoryCard';
import { Link } from 'react-router-dom';
import { useVenues } from '@/hooks/useVenues';
import { useDivisions } from '@/hooks/useDivisions';
import { MapPin } from 'lucide-react';

export default function VenuesPage() {
  const { data: divisions = [] } = useDivisions();
  const { data: venues = [], isLoading, isError, refetch } = useVenues();

  return (
    <PageLayout>
      <PageHeader title="Venues" subtitle="Browse venues by division or view all facilities" icon={MapPin} />

      <PageContent innerClassName="max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {divisions.map((division) => (
            <DivisionDirectoryCard
              key={division.id}
              division={division}
              description={`${division.name} match venues`}
            />
          ))}
        </div>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          isEmpty={venues.length === 0}
          onRetry={() => refetch()}
          emptyMessage="No venues listed yet."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <Link key={venue.id} to={`/venues/${venue.slug}`} className="group">
                <div className="rounded-lg border border-border bg-card shadow-sm hover:shadow-lg transition-all overflow-hidden">
                  {venue.photos?.[0] && (
                    <img
                      src={venue.photos[0]}
                      alt={venue.name}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                      {venue.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {venue.address}, {venue.city}
                      </span>
                    </div>
                    {venue.parking_info && (
                      <p className="text-xs text-muted-foreground mt-2">{venue.parking_info}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </QueryState>
      </PageContent>
    </PageLayout>
  );
}
