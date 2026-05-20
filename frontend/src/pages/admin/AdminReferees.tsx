import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import RefereeFormDialog from '@/components/admin/forms/RefereeFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useReferees, useDeleteReferee } from '@/hooks/useReferees';
import type { Referee } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

const columns = [
  {
    key: 'name',
    label: 'Referee',
    render: (r: Referee) => (
      <div>
        <p className="font-bold text-gray-900">
          {r.first_name} {r.last_name}
        </p>
        <p className="text-xs text-gray-400">{r.email ?? '—'}</p>
      </div>
    ),
  },
  { key: 'phone', label: 'Phone', render: (r: Referee) => <span>{r.phone ?? '—'}</span> },
  {
    key: 'certification',
    label: 'Certification',
    render: (r: Referee) => (
      <span className="text-xs bg-[#CCFF00] text-black font-bold px-2 py-0.5 rounded-full">
        {r.certification ?? 'N/A'}
      </span>
    ),
  },
];

export default function AdminReferees() {
  const { data: referees = [], isLoading, isError, refetch } = useReferees();
  const deleteMutation = useDeleteReferee();
  const formDialog = useFormDialog<Referee>();

  const handleDelete = async (r: Referee) => {
    if (!confirm(`Delete ${r.first_name} ${r.last_name}?`)) return;
    try {
      await deleteMutation.mutateAsync(r.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete referee'));
    }
  };

  return (
    <AdminLayout title="Referees">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Referees"
          data={referees}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={handleDelete}
          searchKeys={['first_name', 'last_name', 'certification']}
        />
      </QueryState>

      <RefereeFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        referee={formDialog.editing}
      />
    </AdminLayout>
  );
}
