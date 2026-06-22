import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import AnnouncementFormDialog from '@/components/admin/forms/AnnouncementFormDialog';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useAnnouncements, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import type { Announcement } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getApiErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

const TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ANNOUNCEMENT: 'default',
  INFO: 'secondary',
  WARNING: 'destructive',
  SUCCESS: 'outline',
};

export default function AdminAnnouncements() {
  const { data: announcements = [], isLoading, isError, refetch } = useAnnouncements();
  const deleteMutation = useDeleteAnnouncement();
  const formDialog = useFormDialog<Announcement>();
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (a: Announcement) => (
        <div>
          <p className="font-medium text-foreground">{a.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.message}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (a: Announcement) => (
        <Badge variant={TYPE_VARIANT[a.type] ?? 'secondary'}>
          {a.type.charAt(0) + a.type.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      key: 'tournament',
      label: 'Tournament',
      render: (a: Announcement) => (
        <span className="text-sm text-muted-foreground">
          {a.tournament?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Published',
      render: (a: Announcement) => (
        <span className="text-sm text-muted-foreground">{formatDate(a.created_at)}</span>
      ),
    },
  ];

  return (
    <AdminLayout title="Announcements">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Announcements"
          data={announcements}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={(a) => setDeleteTarget(a)}
          searchKeys={['title', 'message']}
          searchPlaceholder="Search announcements…"
        />
      </QueryState>

      <AnnouncementFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        announcement={formDialog.editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This will permanently remove the announcement from the home page."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success('Announcement deleted.');
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to delete'));
          }
          setDeleteTarget(null);
        }}
      />
    </AdminLayout>
  );
}
