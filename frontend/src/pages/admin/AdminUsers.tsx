import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import UserRoleFormDialog from '@/components/admin/forms/UserRoleFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
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

const columns = [
  {
    key: 'name',
    label: 'User',
    render: (u: User) => (
      <div>
        <p className="font-bold text-gray-900">
          {u.first_name} {u.last_name}
        </p>
        <p className="text-xs text-gray-400">{u.email}</p>
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
    render: (u: User) => <span className="text-xs text-gray-500">{formatDate(u.created_at)}</span>,
  },
];

export default function AdminUsers() {
  const { data: users = [], isLoading, isError, refetch } = useUsers();
  const deleteMutation = useDeleteUser();
  const formDialog = useFormDialog<User>();

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
          columns={columns}
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
    </AdminLayout>
  );
}
