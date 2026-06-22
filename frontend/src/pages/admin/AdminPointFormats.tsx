import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import PointFormatFormDialog from '@/components/admin/forms/PointFormatFormDialog';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { usePointFormats, useDeletePointFormat } from '@/hooks/usePointFormats';
import type { PointFormat } from '@/types';
import { BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getApiErrorMessage } from '@/lib/errors';

function formatSummary(pf: PointFormat) {
  const base = `${pf.win}/${pf.draw}/${pf.loss}`;
  if (!pf.bonuses_enabled) return base;
  const max = pf.win + pf.shutout_bonus + pf.goal_bonus_cap;
  return `${base} · max ${max}`;
}

export default function AdminPointFormats() {
  const { data: formats = [], isLoading, isError, refetch } = usePointFormats();
  const deleteMutation = useDeletePointFormat();
  const formDialog = useFormDialog<PointFormat>();
  const [deleteTarget, setDeleteTarget] = useState<PointFormat | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columns = [
    {
      key: 'name',
      label: 'Format',
      render: (pf: PointFormat) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground flex items-center gap-2">
              {pf.name}
              {pf.is_system && (
                <Badge variant="secondary" className="text-[10px]">
                  System
                </Badge>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{pf.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'points',
      label: 'Scoring',
      render: (pf: PointFormat) => (
        <span className="text-sm text-muted-foreground">{formatSummary(pf)}</span>
      ),
    },
    {
      key: 'divisions',
      label: 'Divisions',
      render: (pf: PointFormat) => (
        <span className="text-sm">{pf._count?.divisions ?? 0}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (pf: PointFormat) => (
        <span className="text-xs text-muted-foreground line-clamp-2">
          {pf.description || '—'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title="Point Formats">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Point Formats"
          data={formats}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={(pf) => {
            setDeleteError(null);
            setDeleteTarget(pf);
          }}
          searchKeys={['name', 'slug', 'description']}
        />
        <p className="text-xs text-muted-foreground mt-4">
          Assign formats to divisions from{' '}
          <Link to="/admin/divisions" className="text-primary underline-offset-2 hover:underline">
            Divisions
          </Link>
          .
        </p>
      </QueryState>

      <PointFormatFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        format={formDialog.editing}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        title={`Delete "${deleteTarget?.name}"?`}
        description={
          deleteError ??
          (deleteTarget?._count?.divisions
            ? `This format is assigned to ${deleteTarget._count.divisions} division(s) and cannot be deleted until reassigned.`
            : 'This will permanently delete this point format.')
        }
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          if ((deleteTarget._count?.divisions ?? 0) > 0) {
            setDeleteTarget(null);
            return;
          }
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          } catch (err) {
            setDeleteError(getApiErrorMessage(err));
          }
        }}
      />
    </AdminLayout>
  );
}
