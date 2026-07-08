import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import TournamentFormDialog from '@/components/admin/forms/TournamentFormDialog';
import { RecordHistoryDrawer } from '@/components/admin/RecordHistoryDrawer';
import { useFormDialog } from '@/hooks/useFormDialog';
import {
  useManagedTournaments,
  useDeleteTournament,
  useRestoreTournament,
  usePurgeTournament,
  useRestoreTournamentVersion,
  useCompleteTournament,
} from '@/hooks/useTournaments';
import type { RecordScope, Tournament } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/errors';

export default function AdminTournaments() {
  const navigate = useNavigate();
  const [scope, setScope] = useState<RecordScope>('active');
  const { data: tournaments = [], isLoading, isError, refetch } =
    useManagedTournaments(scope);

  const deleteMutation = useDeleteTournament();
  const restoreMutation = useRestoreTournament();
  const purgeMutation = usePurgeTournament();
  const restoreVersionMutation = useRestoreTournamentVersion();
  const completeMutation = useCompleteTournament();

  const formDialog = useFormDialog<Tournament>();
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<Tournament | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Tournament | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Tournament | null>(null);

  const columns = [
    {
      key: 'name',
      label: 'Tournament',
      render: (t: Tournament) => (
        <div>
          <p className="font-semibold text-foreground">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.slug}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (t: Tournament) =>
        t.is_deleted ? (
          <Badge variant="live">DELETED</Badge>
        ) : (
          <Badge variant={t.status === 'ACTIVE' ? 'live' : t.status === 'COMPLETED' ? 'success' : 'default'}>
            {t.status}
          </Badge>
        ),
    },
    { key: 'location', label: 'Location' },
    {
      key: 'start_date',
      label: 'Dates',
      render: (t: Tournament) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(t.start_date)} – {formatDate(t.end_date)}
        </span>
      ),
    },
    {
      key: 'tournament_type',
      label: 'Type',
      render: (t: Tournament) => (
        <span className="text-xs">{t.tournament_type.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'workspace',
      label: 'Workspace',
      render: (t: Tournament) => (
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/tournaments/${t.id}`);
            }}
            className="gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </Button>
          {!t.is_deleted && t.status !== 'COMPLETED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setCompleteTarget(t);
              }}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  const busy =
    restoreMutation.isPending ||
    purgeMutation.isPending ||
    restoreVersionMutation.isPending;

  return (
    <AdminLayout title="Tournaments">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Tournaments"
          data={tournaments}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={(t) => setDeleteTarget(t)}
          onHistory={(t) => setHistoryTarget(t)}
          onRestore={(t) => restoreMutation.mutate(t.id)}
          onPurge={(t) => setPurgeTarget(t)}
          getIsDeleted={(t) => !!t.is_deleted}
          scope={scope}
          onScopeChange={setScope}
          searchKeys={['name', 'location']}
        />
      </QueryState>

      <TournamentFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        tournament={formDialog.editing}
      />

      <ConfirmDialog
        open={!!completeTarget}
        onOpenChange={(open) => !open && setCompleteTarget(null)}
        title={`Complete "${completeTarget?.name}"?`}
        description="The tournament will be marked completed and locked for viewing. You can re-enable editing later from the workspace."
        confirmLabel="Complete tournament"
        onConfirm={async () => {
          if (!completeTarget) return;
          try {
            await completeMutation.mutateAsync(completeTarget.id);
            toast.success('Tournament completed.');
            refetch();
            setCompleteTarget(null);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to complete tournament'));
            throw err;
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This decommissions the tournament (soft delete). It is hidden from public views but preserved and fully restorable."
        confirmLabel="Delete"
        showErrorToast={false}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success('Tournament decommissioned.');
            refetch();
            setDeleteTarget(null);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to delete tournament'));
            throw err;
          }
        }}
      />

      <ConfirmDialog
        open={!!purgeTarget}
        onOpenChange={(open) => !open && setPurgeTarget(null)}
        title={`Permanently purge "${purgeTarget?.name}"?`}
        description="This permanently hard-deletes the record and cannot be undone. Use Restore instead unless you are certain."
        confirmLabel="Purge permanently"
        showErrorToast={false}
        onConfirm={async () => {
          if (!purgeTarget) return;
          try {
            await purgeMutation.mutateAsync(purgeTarget.id);
            toast.success('Tournament permanently deleted.');
            refetch();
            setPurgeTarget(null);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to purge tournament'));
            throw err;
          }
        }}
      />

      <RecordHistoryDrawer
        entity="Tournament"
        open={!!historyTarget}
        onOpenChange={(open) => !open && setHistoryTarget(null)}
        recordId={historyTarget?.id}
        recordLabel={historyTarget?.name}
        isDeleted={historyTarget?.is_deleted}
        busy={busy}
        onRestoreRecord={
          historyTarget ? () => restoreMutation.mutate(historyTarget.id) : undefined
        }
        onRestoreVersion={
          historyTarget
            ? (versionId) =>
                restoreVersionMutation.mutate({ id: historyTarget.id, versionId })
            : undefined
        }
      />
    </AdminLayout>
  );
}
