import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import TeamFormDialog from '@/components/admin/forms/TeamFormDialog';
import TeamRosterPanel from '@/components/admin/TeamRosterPanel';
import { RecordHistoryDrawer } from '@/components/admin/RecordHistoryDrawer';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import {
  useTeams,
  useDeleteTeam,
  useRestoreTeam,
  usePurgeTeam,
  useRestoreTeamVersion,
} from '@/hooks/useTeams';
import type { RecordScope, Team } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

const columns = (onRoster: (t: Team) => void) => [
  {
    key: 'name',
    label: 'Team',
    render: (t: Team) => (
      <div className="flex items-center gap-3">
        {t.logo ? (
          <img src={t.logo} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
            style={{ backgroundColor: t.primary_color ?? '#F48735' }}
          >
            {t.name[0]}
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.city}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'division_id',
    label: 'Division',
    render: (t: Team) => (
      <span className="text-xs text-muted-foreground">{t.division?.name ?? '—'}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (t: Team) =>
      t.is_deleted ? (
        <Badge variant="live">DELETED</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">{t.city ?? '—'}</span>
      ),
  },
  {
    key: 'roster',
    label: 'Roster',
    render: (t: Team) => (
      <Button variant="outline" size="sm" onClick={() => onRoster(t)}>
        <Users className="h-3.5 w-3.5 mr-1" aria-hidden />
        Manage
      </Button>
    ),
  },
];

export default function AdminTeams() {
  const [scope, setScope] = useState<RecordScope>('active');
  const { data: teams = [], isLoading, isError, refetch } = useTeams({ scope });
  const deleteMutation = useDeleteTeam();
  const restoreMutation = useRestoreTeam();
  const purgeMutation = usePurgeTeam();
  const restoreVersionMutation = useRestoreTeamVersion();

  const formDialog = useFormDialog<Team>();
  const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<Team | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Team | null>(null);

  const busy =
    restoreMutation.isPending ||
    purgeMutation.isPending ||
    restoreVersionMutation.isPending;

  return (
    <AdminLayout title="Teams">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Teams"
          data={teams}
          columns={columns(setRosterTeam)}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={(t) => setDeleteTarget(t)}
          onHistory={(t) => setHistoryTarget(t)}
          onRestore={(t) => restoreMutation.mutate(t.id)}
          onPurge={(t) => setPurgeTarget(t)}
          getIsDeleted={(t) => !!t.is_deleted}
          scope={scope}
          onScopeChange={setScope}
          searchKeys={['name', 'city']}
        />
      </QueryState>

      <TeamFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        team={formDialog.editing}
      />

      {rosterTeam && (
        <div className="mt-6">
          <TeamRosterPanel team={rosterTeam} />
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setRosterTeam(null)}>
            Close roster panel
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This decommissions the team (soft delete). It is hidden from public views but preserved and fully restorable."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success('Team decommissioned.');
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to delete team'));
          }
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={!!purgeTarget}
        onOpenChange={(open) => !open && setPurgeTarget(null)}
        title={`Permanently purge "${purgeTarget?.name}"?`}
        description="This permanently hard-deletes the team and cannot be undone. Use Restore instead unless you are certain."
        confirmLabel="Purge permanently"
        onConfirm={async () => {
          if (!purgeTarget) return;
          try {
            await purgeMutation.mutateAsync(purgeTarget.id);
            toast.success('Team permanently purged.');
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to purge team'));
          }
          setPurgeTarget(null);
        }}
      />

      <RecordHistoryDrawer
        entity="Team"
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
