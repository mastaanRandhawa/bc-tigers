import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import TeamFormDialog from '@/components/admin/forms/TeamFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useTeams, useDeleteTeam } from '@/hooks/useTeams';
import type { Team } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

const columns = [
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
            style={{ backgroundColor: t.primary_color ?? '#0038FF' }}
          >
            {t.name[0]}
          </div>
        )}
        <div>
          <p className="font-bold text-gray-900">{t.name}</p>
          <p className="text-xs text-gray-400">{t.city}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'division_id',
    label: 'Division',
    render: (t: Team) => (
      <span className="text-xs text-gray-600">{t.division?.name ?? '—'}</span>
    ),
  },
  { key: 'city', label: 'City' },
  {
    key: 'primary_color',
    label: 'Color',
    render: (t: Team) => (
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full border border-gray-200"
          style={{ backgroundColor: t.primary_color ?? '#ccc' }}
        />
        <span className="text-xs text-gray-500">{t.primary_color ?? '—'}</span>
      </div>
    ),
  },
];

export default function AdminTeams() {
  const { data: teams = [], isLoading, isError, refetch } = useTeams();
  const deleteMutation = useDeleteTeam();
  const formDialog = useFormDialog<Team>();

  const handleDelete = async (t: Team) => {
    if (!confirm(`Delete "${t.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(t.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete team'));
    }
  };

  return (
    <AdminLayout title="Teams">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Teams"
          data={teams}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={handleDelete}
          searchKeys={['name', 'city']}
        />
      </QueryState>

      <TeamFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        team={formDialog.editing}
      />
    </AdminLayout>
  );
}
