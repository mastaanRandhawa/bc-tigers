import { Link, useParams } from 'react-router-dom';
import PortalLayout from '@/components/layouts/PortalLayout';
import QueryState from '@/components/shared/QueryState';
import MatchScoreFormDialog from '@/components/admin/forms/MatchScoreFormDialog';
import MatchEventFormDialog from '@/components/admin/forms/MatchEventFormDialog';
import { useMatch } from '@/hooks/useMatches';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Trophy, ArrowLeft, Zap, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { formatDate, formatTime } from '@/lib/utils';

const nav = [
  { label: 'Dashboard', href: '/referee', icon: LayoutDashboard },
  { label: 'Tournaments', href: '/tournaments', icon: Trophy },
];

export default function RefereeMatchControlPage() {
  const { id = '' } = useParams();
  const { data: match, isLoading, isError, refetch } = useMatch(id);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  return (
    <PortalLayout title="Match Control" subtitle="Live scoring" nav={nav}>
      <Link
        to="/referee"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to assignments
      </Link>

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()} isEmpty={!match}>
        {match && (
          <div className="space-y-6 max-w-lg">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-foreground">
                {match.home_team?.name} vs {match.away_team?.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(match.scheduled_start)} · {formatTime(match.scheduled_start)}
              </p>
              <p className="text-3xl font-bold text-primary mt-4 tabular-nums">
                {match.home_score} – {match.away_score}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Status: {match.status}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setScoreOpen(true)}>
                <Zap className="h-4 w-4 mr-1" aria-hidden />
                Update score
              </Button>
              <Button variant="outline" onClick={() => setEventOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-1" aria-hidden />
                Record event
              </Button>
            </div>
          </div>
        )}
      </QueryState>

      <MatchScoreFormDialog open={scoreOpen} onOpenChange={setScoreOpen} match={match ?? null} />
      <MatchEventFormDialog open={eventOpen} onOpenChange={setEventOpen} match={match ?? null} />
    </PortalLayout>
  );
}
