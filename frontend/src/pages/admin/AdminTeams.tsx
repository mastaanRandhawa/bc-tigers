import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import TeamFormDialog from '@/components/admin/forms/TeamFormDialog';
import TeamRosterPanel from '@/components/admin/TeamRosterPanel';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useTeams, useDeleteTeam } from '@/hooks/useTeams';
import type { Team } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

const columns = (
  onRoster: (t: Team) => void,
) => [
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
  { key: 'city', label: 'City' },
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
  const { data: teams = [], isLoading, isError, refetch } = useTeams();
  const deleteMutation = useDeleteTeam();
  const formDialog = useFormDialog<Team>();
  const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);

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
        description="This team and its roster will be permanently removed."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success('Team deleted.');
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to delete team'));
          }
          setDeleteTarget(null);
        }}
      />
    </AdminLayout>
  );
}
