import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import RefereeFormDialog from '@/components/admin/forms/RefereeFormDialog';
import { RefereeScheduleDrawer } from '@/components/admin/RefereeScheduleDrawer';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useReferees, useDeleteReferee } from '@/hooks/useReferees';
import type { Referee } from '@/types';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/errors';

export default function AdminReferees() {
  const { data: referees = [], isLoading, isError, refetch } = useReferees();
  const deleteMutation = useDeleteReferee();
  const formDialog = useFormDialog<Referee>();
  const [scheduleReferee, setScheduleReferee] = useState<Referee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Referee | null>(null);

  const columns = [
    {
      key: 'name',
      label: 'Referee',
      render: (r: Referee) => (
        <div>
          <p className="font-semibold text-foreground">
            {r.first_name} {r.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{r.email ?? '—'}</p>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (r: Referee) => <span>{r.phone ?? '—'}</span> },
    {
      key: 'certification',
      label: 'Certification',
      render: (r: Referee) => (
        <span className="text-xs bg-primary-muted text-black font-bold px-2 py-0.5 rounded-full">
          {r.certification ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (r: Referee) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5"
          onClick={() => setScheduleReferee(r)}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout title="Referees">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Referees"
          data={referees}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={(r) => setDeleteTarget(r)}
          searchKeys={['first_name', 'last_name', 'certification']}
        />
      </QueryState>

      <RefereeFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        referee={formDialog.editing}
      />
      <RefereeScheduleDrawer
        referee={scheduleReferee}
        open={!!scheduleReferee}
        onOpenChange={(open) => !open && setScheduleReferee(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.first_name} ${deleteTarget?.last_name}?`}
        description="This referee will be permanently removed."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </AdminLayout>
  );
}
