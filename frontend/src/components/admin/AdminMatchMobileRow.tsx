import type { Match } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, getMatchStatusBadgeVariant, matchSideName } from '@/lib/utils';
import { PlusCircle } from 'lucide-react';
import { SoccerBallIcon } from '@/components/icons/SoccerBallIcon';

interface AdminMatchMobileRowProps {
  match: Match;
  onScore: (m: Match) => void;
  onEvent: (m: Match) => void;
  onStatusChange?: (m: Match, status: string) => void;
  statusOptions?: readonly string[];
  showDivision?: boolean;
}

export function AdminMatchMobileRow({
  match,
  onScore,
  onEvent,
  onStatusChange,
  statusOptions,
  showDivision,
}: AdminMatchMobileRowProps) {
  const home = matchSideName(match.home_team, match.home_label);
  const away = matchSideName(match.away_team, match.away_label);
  const hasScore = match.status !== 'SCHEDULED';

  return (
    <div className="space-y-2.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">
          {home}
          <span className="mx-1.5 font-normal text-muted-foreground">vs</span>
          {away}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {showDivision && match.division?.name && (
            <>
              <span>{match.division.name}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>
            {formatDate(match.scheduled_start)} · {formatTime(match.scheduled_start)}
          </span>
          {match.round != null && (
            <>
              <span aria-hidden>·</span>
              <span>Game #{match.round}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onStatusChange && statusOptions ? (
          <select
            value={match.status}
            onChange={(e) => onStatusChange(match, e.target.value)}
            className="min-h-9 flex-1 min-w-[7rem] rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <Badge variant={getMatchStatusBadgeVariant(match.status)}>{match.status}</Badge>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onScore(match)}
            className="flex min-h-9 min-w-[3rem] items-center justify-center rounded-md border border-border bg-background px-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            title="Update score"
          >
            {hasScore ? `${match.home_score}–${match.away_score}` : '—'}
          </button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 w-9 shrink-0 p-0"
            onClick={() => onScore(match)}
            aria-label="Update score"
          >
            <SoccerBallIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 w-9 shrink-0 p-0"
            onClick={() => onEvent(match)}
            aria-label="Add match event"
          >
            <PlusCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
