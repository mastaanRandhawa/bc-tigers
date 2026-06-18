import type { Team, Player } from '@/types';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface MatchRostersProps {
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  className?: string;
}

function RosterColumn({ team, label }: { team?: Team | null; label: string }) {
  const players = (team?.players ?? []).filter((p) => p.active !== false);

  return (
    <div className="rounded-xl border border-border/40 bg-muted/30 p-4 sm:p-5">
      <h4 className="mb-3 text-sm font-semibold text-foreground">{label}</h4>
      {players.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Users className="h-8 w-8 text-muted-foreground/30" aria-hidden />
          <p className="text-xs text-muted-foreground">No active roster players.</p>
        </div>
      ) : (
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {players.map((p: Player) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-background/60"
            >
              <span className="text-foreground">
                {p.first_name} {p.last_name}
              </span>
              {p.jersey_number != null && (
                <span className="text-xs tabular-nums text-muted-foreground">#{p.jersey_number}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MatchRosters({ homeTeam, awayTeam, className }: MatchRostersProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      <RosterColumn team={homeTeam} label={homeTeam?.name ?? 'Home'} />
      <RosterColumn team={awayTeam} label={awayTeam?.name ?? 'Away'} />
    </div>
  );
}
