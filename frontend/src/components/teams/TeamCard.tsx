import { Link } from 'react-router-dom';
import { ChevronRight, Shield } from 'lucide-react';
import { divisionTeamPath } from '@/lib/division-routes';
import type { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  tournamentSlug: string;
  divisionSlug: string;
}

export default function TeamCard({ team, tournamentSlug, divisionSlug }: TeamCardProps) {
  const href = divisionTeamPath(tournamentSlug, divisionSlug, team.slug);
  const color = team.primary_color ?? '#F48735';

  return (
    <Link
      to={href}
      className="group overflow-hidden rounded-xl bg-card shadow-sm border border-border transition-all duration-200 hover:shadow-md hover:border-primary/30"
    >
      <div
        className="flex h-20 items-center justify-center"
        style={{ backgroundColor: color }}
      >
        {team.logo ? (
          <img
            src={team.logo}
            alt=""
            className="h-14 w-14 rounded-full border-2 border-white/30 object-cover"
          />
        ) : (
          <Shield className="h-10 w-10 text-white/90" aria-hidden />
        )}
      </div>
      <div className="p-3.5">
        <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
          {team.name}
        </h3>
        {team.city && <p className="mt-0.5 truncate text-sm text-muted-foreground">{team.city}</p>}
        <div className="mt-2 flex items-center justify-between">
          {team.founded_year && (
            <span className="text-xs text-muted-foreground/70">Est. {team.founded_year}</span>
          )}
          <ChevronRight
            className="ml-auto h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
