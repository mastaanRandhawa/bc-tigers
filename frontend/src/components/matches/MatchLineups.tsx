import type { Team } from '@/types';

interface MatchLineupsProps {
  homeTeam?: Team | null;
  awayTeam?: Team | null;
}

function RosterColumn({ team, label }: { team?: Team | null; label: string }) {
  const players =
    team?.rosters?.map((r) => r.player).filter(Boolean) ?? [];

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">{label}</h4>
      {players.length === 0 ? (
        <p className="text-xs text-muted-foreground">No active roster players.</p>
      ) : (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto">
          {players.map((p) => (
            <li key={p!.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                {p!.first_name} {p!.last_name}
              </span>
              {p!.jersey_number != null && (
                <span className="text-xs text-muted-foreground tabular-nums">#{p!.jersey_number}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MatchLineups({ homeTeam, awayTeam }: MatchLineupsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <RosterColumn team={homeTeam} label={homeTeam?.name ?? 'Home'} />
      <RosterColumn team={awayTeam} label={awayTeam?.name ?? 'Away'} />
    </div>
  );
}
