import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import UserRoleFormDialog from '@/components/admin/forms/UserRoleFormDialog';
import UserLinkDialog from '@/components/admin/forms/UserLinkDialog';
import { useState } from 'react';
import { useFormDialog } from '@/hooks/useFormDialog';
import { Button } from '@/components/ui/button';
import { Link2 } from 'lucide-react';
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

const columns = (onLink: (u: User) => void) => [
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
    key: 'link',
    label: 'Link',
    render: (u: User) => (
      <Button variant="outline" size="sm" onClick={() => onLink(u)}>
        <Link2 className="h-3.5 w-3.5" aria-hidden />
      </Button>
    ),
  },
];

export default function AdminUsers() {
  const { data: users = [], isLoading, isError, refetch } = useUsers();
  const deleteMutation = useDeleteUser();
  const formDialog = useFormDialog<User>();
  const [linkUser, setLinkUser] = useState<User | null>(null);

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete user ${u.email}?`)) return;
    try {
      await deleteMutation.mutateAsync(u.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete user'));
    }
  };

  return (
    <AdminLayout title="Users">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Users"
          data={users}
          columns={columns(setLinkUser)}
          onEdit={formDialog.openEdit}
          onDelete={handleDelete}
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
    </AdminLayout>
  );
}
