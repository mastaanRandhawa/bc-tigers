import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import DivisionFormDialog from '@/components/admin/forms/DivisionFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useDivisions, useDeleteDivision } from '@/hooks/useDivisions';
import type { Division } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

const columns = [
  {
    key: 'name',
    label: 'Division',
    render: (d: Division) => <span className="font-bold text-foreground">{d.name}</span>,
  },
  {
    key: 'tournament_id',
    label: 'Tournament',
    render: (d: Division) => (
      <span className="text-xs text-muted-foreground">{d.tournament?.name ?? '—'}</span>
    ),
  },
  { key: 'age_group', label: 'Age Group' },
  { key: 'gender', label: 'Gender' },
  { key: 'max_teams', label: 'Max Teams' },
  { key: 'format', label: 'Format' },
];

export default function AdminDivisions() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();
  const deleteMutation = useDeleteDivision();
  const formDialog = useFormDialog<Division>();

  const handleDelete = async (d: Division) => {
    if (!confirm(`Delete "${d.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(d.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete division'));
    }
  };

  return (
    <AdminLayout title="Divisions">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Divisions"
          data={divisions}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={handleDelete}
          searchKeys={['name', 'age_group']}
        />
      </QueryState>

      <DivisionFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        division={formDialog.editing}
      />
    </AdminLayout>
  );
}
