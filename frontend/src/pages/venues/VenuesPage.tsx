import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import { Link } from 'react-router-dom';
import { useVenues } from '@/hooks/useVenues';
import { MapPin } from 'lucide-react';

export default function VenuesPage() {
  const { data: venues = [], isLoading, isError, refetch } = useVenues();

  return (
    <PageLayout>
      <PageHeader title="Venues" subtitle="Soccer facilities across British Columbia" icon={MapPin} />

      <section className="py-10 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
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
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                    {venue.photos?.[0] && (
                      <img
                        src={venue.photos[0]}
                        alt={venue.name}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="p-5">
                      <h3 className="font-black text-gray-900 text-lg group-hover:text-[#0038FF] transition-colors">
                        {venue.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0038FF]" />
                        <span>
                          {venue.address}, {venue.city}
                        </span>
                      </div>
                      {venue.parking_info && (
                        <p className="text-xs text-gray-500 mt-2">{venue.parking_info}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
