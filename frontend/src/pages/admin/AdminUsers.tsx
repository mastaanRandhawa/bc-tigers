import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import UserRoleFormDialog from '@/components/admin/forms/UserRoleFormDialog';
import UserLinkDialog from '@/components/admin/forms/UserLinkDialog';
import { AuditLogDrawer } from '@/components/admin/AuditLogDrawer';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useState } from 'react';
import { useFormDialog } from '@/hooks/useFormDialog';
import { Button } from '@/components/ui/button';
import { Link2, ClipboardList } from 'lucide-react';
import { useUsers, useDeleteUser } from '@/hooks/useUsers';
import type { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';

const roleVariant: Record<string, 'default' | 'accent' | 'secondary' | 'success' | 'warning'> = {
  ADMIN: 'default',
  TOURNAMENT_ADMIN: 'accent',
  COACH: 'success',
  REFEREE: 'warning',
  PLAYER: 'secondary',
  VIEWER: 'secondary',
};

export default function AdminUsers() {
  const { data: users = [], isLoading, isError, refetch } = useUsers();
  const deleteMutation = useDeleteUser();
  const formDialog = useFormDialog<User>();
  const [linkUser, setLinkUser] = useState<User | null>(null);
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
      render: (u: User) => <Badge variant={roleVariant[u.role] ?? 'secondary'}>{u.role}</Badge>,
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
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setLinkUser(u)} title="Link to player/coach/referee">
            <Link2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setAuditUser(u)} title="View audit trail">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
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
      <UserLinkDialog
        open={!!linkUser}
        onOpenChange={(open) => !open && setLinkUser(null)}
        user={linkUser}
      />
      <AuditLogDrawer
        userId={auditUser?.id}
        title={auditUser ? `Audit Trail — ${auditUser.first_name} ${auditUser.last_name}` : 'Audit Trail'}
        open={!!auditUser}
        onOpenChange={(open) => !open && setAuditUser(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete user ${deleteTarget?.email}?`}
        description="This user will be permanently removed."
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
