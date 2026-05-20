import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';
import type { Division } from '@/types';

interface DivisionHeroProps {
  division: Division;
}

export default function DivisionHero({ division }: DivisionHeroProps) {
  const tournament = division.tournament;

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5 safe-x">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3 min-w-0 overflow-x-auto no-scrollbar"
      >
        <Link to="/tournaments" className="hover:text-foreground transition-colors shrink-0">
          Tournaments
        </Link>
        <span className="shrink-0 text-zinc-300">/</span>
        {tournament && (
          <>
            <Link
              to={`/tournaments/${tournament.slug}`}
              className="hover:text-foreground transition-colors truncate max-w-[8rem] sm:max-w-xs"
              title={tournament.name}
            >
              {tournament.name}
            </Link>
            <span className="shrink-0 text-zinc-300">/</span>
          </>
        )}
        <span className="text-foreground font-medium truncate">{division.name}</span>
      </nav>

      <div className="flex items-center gap-4">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary-muted border border-primary/15">
          <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="division-hero-headline text-2xl sm:text-3xl md:text-4xl truncate">
            {division.name}
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {division.age_group && (
              <span className="division-badge">{division.age_group}</span>
            )}
            <span className="division-badge">{division.gender}</span>
            <span className="division-badge">{division.format}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
