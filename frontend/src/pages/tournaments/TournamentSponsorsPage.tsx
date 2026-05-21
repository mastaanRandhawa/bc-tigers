import SectionBlock from '@/components/design-system/SectionBlock';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import EmptyStatePanel from '@/components/design-system/EmptyStatePanel';
import { useTournamentRoute } from '@/context/TournamentContext';
import { Award } from 'lucide-react';

export default function TournamentSponsorsPage() {
  const { tournament } = useTournamentRoute();
  const sponsors: { name: string; logo?: string }[] = [];

  return (
    <SectionBlock title="Sponsors & partners" variant="card">
      {sponsors.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {sponsors.map((sponsor) => (
            <SurfaceCard
              key={sponsor.name}
              variant="interactive"
              padding="lg"
              className="flex flex-col items-center justify-center text-center"
            >
              {sponsor.logo && (
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="h-16 w-auto max-w-full object-contain"
                />
              )}
              <p className="mt-3 text-sm font-black uppercase tracking-tight text-foreground">{sponsor.name}</p>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <EmptyStatePanel
          icon={Award}
          title="Sponsors coming soon"
          description="Partner and sponsor information will be published closer to the tournament."
        />
      )}
    </SectionBlock>
  );
}
