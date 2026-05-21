import { Link } from 'react-router-dom';
import { ChevronRight, Shield } from 'lucide-react';
import { divisionTeamPath } from '@/lib/division-routes';
import type { Team } from '@/types';
import { cn } from '@/lib/utils';

interface TeamCardProps {
  team: Team;
  tournamentSlug: string;
  divisionSlug: string;
}

export default function TeamCard({ team, tournamentSlug, divisionSlug }: TeamCardProps) {
  const href = divisionTeamPath(tournamentSlug, divisionSlug, team.slug);
  const color = team.primary_color ?? '#F48735';

  return (
    <Link to={href} className="group ds-card-hover overflow-hidden press-scale">
      <div
        className="flex h-20 items-center justify-center border-b-2 border-foreground"
        style={{ backgroundColor: color }}
      >
        {team.logo ? (
          <img
            src={team.logo}
            alt=""
            className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-hard-sm"
          />
        ) : (
          <Shield className="h-10 w-10 text-white" aria-hidden />
        )}
      </div>
      <div className="p-3.5">
        <h3 className="truncate text-sm font-black uppercase tracking-tight text-foreground transition-colors group-hover:text-primary">
          {team.name}
        </h3>
        {team.city && <p className="mt-0.5 truncate text-xs font-semibold text-foreground/55 normal-case">{team.city}</p>}
        <div className="mt-2 flex items-center justify-between">
          {team.founded_year && (
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
              Est. {team.founded_year}
            </span>
          )}
          <ChevronRight
            className="ml-auto h-4 w-4 text-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
