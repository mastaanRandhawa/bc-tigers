import { MapPin, Shield } from 'lucide-react';
import MetaChip from '@/components/design-system/MetaChip';
import GeometricAccent from '@/components/design-system/GeometricAccent';
import type { Team } from '@/types';

interface TeamHeroProps {
  team: Team;
}

export default function TeamHero({ team }: TeamHeroProps) {
  const color = team.primary_color ?? 'var(--division-primary, #F48735)';

  return (
    <div
      className="relative overflow-hidden border-b-2 border-foreground"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color} 50%, #121212) 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-hero-mesh opacity-35" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-25" aria-hidden />
      <GeometricAccent shape="circle" position="top-right" size="lg" color="muted" />
      <GeometricAccent shape="square" position="bottom-left" size="sm" color="yellow" rotate />

      <div className="page-container relative z-10 py-5 sm:py-7">
        <div className="flex flex-col items-center gap-4 text-center text-white sm:flex-row sm:text-left">
          {team.logo ? (
            <img
              src={team.logo}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-hard-sm sm:h-20 sm:w-20"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white/10 shadow-hard-sm sm:h-20 sm:w-20">
              <Shield className="h-8 w-8 text-white sm:h-10 sm:w-10" aria-hidden />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-overline m-0 text-white/50">Team</p>
            <h1 className="text-hero-title m-0 mt-1 text-white">{team.name}</h1>
            {team.city && (
              <div className="mt-3 flex justify-center sm:justify-start">
                <MetaChip icon={MapPin} value={team.city} variant="dark" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
