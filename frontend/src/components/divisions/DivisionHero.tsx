import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';
import type { Division } from '@/types';

interface DivisionHeroProps {
  division: Division;
}

export default function DivisionHero({ division }: DivisionHeroProps) {
  const tournament = division.tournament;

  return (
    <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-6 safe-x">
      <div className="flex items-center gap-1.5 sm:gap-2 text-white/75 text-xs sm:text-sm mb-3 sm:mb-4 min-w-0 overflow-x-auto no-scrollbar">
        <Link to="/tournaments" className="hover:text-white transition-colors shrink-0">
          Tournaments
        </Link>
        <span className="shrink-0">/</span>
        {tournament && (
          <>
            <Link
              to={`/tournaments/${tournament.slug}`}
              className="hover:text-white transition-colors truncate max-w-[10rem] sm:max-w-xs md:max-w-md"
              title={tournament.name}
            >
              {tournament.name}
            </Link>
            <span className="shrink-0">/</span>
          </>
        )}
        <span className="text-white font-semibold truncate">{division.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white/30"
          style={{ backgroundColor: 'var(--division-accent)' }}
        >
          <Flag className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" style={{ color: 'var(--division-accent-fg)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="division-hero-headline text-[clamp(1.75rem,7vw,4rem)] text-white break-words">
            {division.name}
          </h1>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
            {division.age_group && (
              <span className="division-badge">{division.age_group}</span>
            )}
            <span className="division-badge">{division.gender}</span>
            <span className="division-badge max-w-full truncate">{division.format}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
