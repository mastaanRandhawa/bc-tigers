import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import UserRoleFormDialog from '@/components/admin/forms/UserRoleFormDialog';
import { AuditLogDrawer } from '@/components/admin/AuditLogDrawer';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useState } from 'react';
import { useFormDialog } from '@/hooks/useFormDialog';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';
import { useUsers, useDeleteUser } from '@/hooks/useUsers';
import type { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';

export default function AdminUsers() {
  const { data: users = [], isLoading, isError, refetch } = useUsers();
  const deleteMutation = useDeleteUser();
  const formDialog = useFormDialog<User>();
  const [auditUser, setAuditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (u: User) => (
        <div>
          <p className="font-semibold text-foreground">
            {u.first_name} {u.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (u: User) => <Badge variant="default">{u.role}</Badge>,
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (u: User) => <span className="text-xs text-muted-foreground">{formatDate(u.created_at)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (u: User) => (
        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setAuditUser(u)} title="View audit trail">
          <ClipboardList className="h-3.5 w-3.5" aria-hidden />
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout title="Users">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Users"
          data={users}
          columns={columns}
          onEdit={formDialog.openEdit}
          onDelete={(u) => setDeleteTarget(u)}
          searchKeys={['first_name', 'last_name', 'email']}
        />
      </QueryState>

      <UserRoleFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        user={formDialog.editing}
      />

      <AuditLogDrawer
        open={!!auditUser}
        onOpenChange={(open) => { if (!open) setAuditUser(null); }}
        userId={auditUser?.id}
        title={auditUser ? `Audit · ${auditUser.first_name} ${auditUser.last_name}` : 'Audit Trail'}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete user?"
        description={deleteTarget ? `Permanently delete ${deleteTarget.email}?` : ''}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          } catch (err) {
            alert(getApiErrorMessage(err, 'Failed to delete user'));
          }
        }}
      />
    </AdminLayout>
  );
}
