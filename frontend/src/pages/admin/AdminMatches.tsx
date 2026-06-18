import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import MatchFormDialog from '@/components/admin/forms/MatchFormDialog';
import MatchScoreFormDialog from '@/components/admin/forms/MatchScoreFormDialog';
import MatchEventFormDialog from '@/components/admin/forms/MatchEventFormDialog';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useMatches, useDeleteMatch } from '@/hooks/useMatches';
import type { Match } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, getMatchStatusBadgeVariant } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import { matchSearchText } from '@/lib/search-text';
import { Zap, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

const columns = (onScore: (m: Match) => void, onEvent: (m: Match) => void) => [
  {
    key: 'teams',
    label: 'Match',
    render: (m: Match) => (
      <div>
        <p className="font-semibold text-foreground">
          {m.home_team?.name ?? 'TBD'} vs {m.away_team?.name ?? 'TBD'}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(m.scheduled_start)} · {formatTime(m.scheduled_start)}
        </p>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (m: Match) => (
      <Badge variant={getMatchStatusBadgeVariant(m.status)}>
        {m.status}
      </Badge>
    ),
  },
  {
    key: 'score',
    label: 'Score',
    render: (m: Match) => (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">
          {m.status !== 'SCHEDULED' ? `${m.home_score} – ${m.away_score}` : '–'}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onScore(m);
          }}
        >
          <Zap className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onEvent(m);
          }}
        >
          <PlusCircle className="w-3 h-3" />
        </Button>
      </div>
    ),
  },
  { key: 'round', label: 'Round', render: (m: Match) => <span>{m.round ?? '—'}</span> },
];

export default function AdminMatches() {
  const { data: matches = [], isLoading, isError, refetch } = useMatches();
  const deleteMutation = useDeleteMatch();
  const formDialog = useFormDialog<Match>();
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);
  const [eventMatch, setEventMatch] = useState<Match | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Match | null>(null);

  return (
    <AdminLayout title="Matches">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Matches"
          data={matches}
          columns={columns(setScoreMatch, setEventMatch)}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={(m) => setDeleteTarget(m)}
          getSearchText={matchSearchText}
        />
      </QueryState>

      <MatchFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        match={formDialog.editing}
      />
      <MatchScoreFormDialog open={!!scoreMatch} onOpenChange={(open) => !open && setScoreMatch(null)} match={scoreMatch} />
      <MatchEventFormDialog open={!!eventMatch} onOpenChange={(open) => !open && setEventMatch(null)} match={eventMatch} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete match?"
        description="This match will be permanently removed."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success('Match deleted.');
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to delete match'));
          }
          setDeleteTarget(null);
        }}
      />
    </AdminLayout>
  );
}
