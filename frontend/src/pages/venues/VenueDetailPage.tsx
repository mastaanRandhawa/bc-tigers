import { useParams } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { useVenue } from '@/hooks/useVenues';
import { MapPin, Car, Clock } from 'lucide-react';

export default function VenueDetailPage() {
  const { venueSlug } = useParams();
  const { data: venue, isLoading, isError, refetch } = useVenue(venueSlug);

  return (
    <PageLayout>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!venue}
        onRetry={() => refetch()}
        emptyMessage="Venue not found."
      >
        {venue && (
          <>
            {venue.photos?.[0] ? (
              <div className="h-64 md:h-96 relative overflow-hidden">
                <img src={venue.photos[0]} alt={venue.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h1 className="text-display">
                    {venue.name}
                  </h1>
                  <div className="flex items-center gap-1 mt-2 text-white/70">
                    <MapPin className="w-4 h-4" />
                    <span>{venue.address}, {venue.city}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-primary py-12 px-4">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-4xl md:text-6xl text-display text-white">
                    {venue.name}
                  </h1>
                  <div className="flex items-center gap-1 mt-2 text-white/70">
                    <MapPin className="w-4 h-4" />
                    <span>{venue.address}, {venue.city}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto px-4 py-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="rounded-lg border border-border bg-card shadow-sm p-6">
                    <h2 className="font-semibold text-foreground uppercase mb-4">Venue Details</h2>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Address</p>
                          <p className="text-sm text-gray-700">{venue.address}, {venue.city}</p>
                        </div>
                      </div>
                      {venue.parking_info && (
                        <div className="flex items-start gap-3">
                          <Car className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Parking</p>
                            <p className="text-sm text-gray-700">{venue.parking_info}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Map integration available</p>
                      <p className="text-xs text-gray-300">{venue.address}, {venue.city}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-card shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-foreground uppercase text-sm">Upcoming Matches</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">No upcoming matches scheduled at this venue.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </PageLayout>
  );
}
