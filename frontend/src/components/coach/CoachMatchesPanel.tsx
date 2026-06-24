import { CalendarDays } from 'lucide-react';
import MatchCard from '@/components/MatchCard';
import QueryState from '@/components/shared/QueryState';
import { useCoachMatches } from '@/hooks/useCoach';
import type { Team } from '@/types';

interface CoachMatchesPanelProps {
  team: Team;
}

export default function CoachMatchesPanel({ team }: CoachMatchesPanelProps) {
  const { data: matches = [], isLoading, isError, refetch } = useCoachMatches(!!team.id);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Team matches
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a match below to record or update goals for {team.name}.
        </p>
      </div>

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches scheduled for your team yet.</p>
        ) : (
          <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
            {matches.map((match, index) => (
              <MatchCard key={match.id} match={match} flat divider={index > 0} />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
