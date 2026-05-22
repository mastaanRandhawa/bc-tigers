import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import CoachFormDialog from '@/components/admin/forms/CoachFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useCoaches, useDeleteCoach } from '@/hooks/useCoaches';
import type { Coach } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

const columns = [
  {
    key: 'name',
    label: 'Coach',
    render: (c: Coach) => (
      <div>
        <p className="font-semibold text-foreground">
          {c.first_name} {c.last_name}
        </p>
        <p className="text-xs text-muted-foreground">{c.email ?? '—'}</p>
      </div>
    ),
  },
  { key: 'phone', label: 'Phone', render: (c: Coach) => c.phone ?? '—' },
  {
    key: 'teams',
    label: 'Teams',
    render: (c: Coach) => (
      <span className="text-xs text-muted-foreground">
        {c.team_coaches?.length ?? 0} assigned
      </span>
    ),
  },
];

export default function AdminCoaches() {
  const { data: coaches = [], isLoading, isError, refetch } = useCoaches();
  const deleteMutation = useDeleteCoach();
  const formDialog = useFormDialog<Coach>();

  const handleDelete = async (c: Coach) => {
    if (!confirm(`Delete ${c.first_name} ${c.last_name}?`)) return;
    try {
      await deleteMutation.mutateAsync(c.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete coach'));
    }
  };

  return (
    <AdminLayout title="Coaches">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Coaches"
          data={coaches}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={handleDelete}
          searchKeys={['first_name', 'last_name', 'email']}
        />
      </QueryState>
      <CoachFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        coach={formDialog.editing}
      />
    </AdminLayout>
  );
}
