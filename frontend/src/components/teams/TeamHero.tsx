import { Shield } from 'lucide-react';
import type { Team } from '@/types';

interface TeamHeroProps {
  team: Team;
}

export default function TeamHero({ team }: TeamHeroProps) {
  const color = team.primary_color ?? 'var(--division-primary, #F48735)';

  return (
    <div
      className="mb-5 overflow-hidden rounded-xl shadow-sm ring-1 ring-border/60"
      style={{ backgroundColor: color }}
    >
      <div className="px-6 py-8 text-center text-white">
        {team.logo ? (
          <img
            src={team.logo}
            alt=""
            className="mx-auto mb-3 h-20 w-20 rounded-full border-4 border-white/30 object-cover"
          />
        ) : (
          <Shield className="mx-auto mb-3 h-16 w-16 text-white/90" aria-hidden />
        )}
        <h1 className="text-2xl font-bold tracking-tight font-display sm:text-3xl">{team.name}</h1>
        {team.city && <p className="mt-1 text-sm text-white/85">{team.city}</p>}
      </div>
    </div>
  );
}
