import { Link } from 'react-router-dom';
import type { Player } from '@/types';
import { divisionTeamPlayerPath } from '@/lib/division-routes';

interface RosterListProps {
  players: (Player | null | undefined)[];
  tournamentSlug: string;
  divisionSlug: string;
  teamSlug: string;
}

export default function RosterList({
  players,
  tournamentSlug,
  divisionSlug,
  teamSlug,
}: RosterListProps) {
  const roster = players.filter(Boolean) as Player[];

  if (roster.length === 0) {
    return <p className="text-sm text-muted-foreground">No players on roster.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {roster.map((player) => (
        <Link
          key={player.id}
          to={divisionTeamPlayerPath(tournamentSlug, divisionSlug, teamSlug, player.id)}
          className="flex items-center gap-3 py-2.5 transition-colors hover:bg-zinc-50/80 rounded-lg px-1 -mx-1"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums"
            style={{
              backgroundColor: 'var(--division-accent)',
              color: 'var(--division-primary)',
            }}
          >
            {player.jersey_number ?? '–'}
          </span>
          <span className="font-medium text-foreground">
            {player.first_name} {player.last_name}
          </span>
          {player.preferred_position && (
            <span className="ml-auto text-xs text-muted-foreground">{player.preferred_position}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
