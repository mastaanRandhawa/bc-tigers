import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import UserRoleFormDialog from '@/components/admin/forms/UserRoleFormDialog';
import UserCreateFormDialog from '@/components/admin/forms/UserCreateFormDialog';
import { AuditLogDrawer } from '@/components/admin/AuditLogDrawer';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import FormDialog from '@/components/admin/FormDialog';
import { useMemo, useState } from 'react';
import { useFormDialog } from '@/hooks/useFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardList, KeyRound, UserCheck } from 'lucide-react';
import {
  useUsers,
  useDeleteUser,
  useApproveUser,
  useResetUserPassword,
  useUpdateUser,
} from '@/hooks/useUsers';
import type { User, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

type UserFilter = 'all' | 'admin' | 'coach' | 'pending';

export default function AdminUsers() {
  const [filter, setFilter] = useState<UserFilter>('all');
  const queryParams = useMemo(() => {
    if (filter === 'admin') return { role: 'ADMIN' as UserRole, limit: 200 };
    if (filter === 'coach') return { role: 'COACH' as UserRole, limit: 200 };
    if (filter === 'pending') return { role: 'COACH' as UserRole, approved: false, limit: 200 };
    return { limit: 200 };
  }, [filter]);

  const { data: users = [], isLoading, isError, refetch } = useUsers(queryParams);
  const deleteMutation = useDeleteUser();
  const approveMutation = useApproveUser();
  const resetPasswordMutation = useResetUserPassword();
  const updateMutation = useUpdateUser();
  const formDialog = useFormDialog<User>();
  const [createOpen, setCreateOpen] = useState(false);
  const [auditUser, setAuditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const statusBadge = (u: User) => {
    if (u.role === 'COACH') {
      if (!u.approved) return <Badge variant="outline">Pending approval</Badge>;
      if (!u.active) return <Badge variant="secondary">Inactive</Badge>;
      return <Badge variant="default">Active</Badge>;
    }
    return u.active === false ? (
      <Badge variant="secondary">Inactive</Badge>
    ) : (
      <Badge variant="default">Active</Badge>
    );
  };

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
      key: 'status',
      label: 'Status',
      render: (u: User) => statusBadge(u),
    },
    {
      key: 'team',
      label: 'Team',
      render: (u: User) =>
        u.coached_team ? (
          <span className="text-xs text-muted-foreground">{u.coached_team.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (u: User) => (
        <span className="text-xs text-muted-foreground">{formatDate(u.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (u: User) => (
        <div className="flex flex-wrap gap-1">
          {u.role === 'COACH' && !u.approved && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1"
              onClick={async () => {
                try {
                  await approveMutation.mutateAsync(u.id);
                  toast.success('Coach approved.');
                } catch (err) {
                  toast.error(getApiErrorMessage(err, 'Failed to approve coach'));
                }
              }}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Approve
            </Button>
          )}
          {u.role === 'COACH' && u.approved && (
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={async () => {
                try {
                  await updateMutation.mutateAsync({
                    id: u.id,
                    data: { active: !u.active },
                  });
                  toast.success(u.active ? 'Coach deactivated.' : 'Coach activated.');
                } catch (err) {
                  toast.error(getApiErrorMessage(err, 'Failed to update coach'));
                }
              }}
            >
              {u.active ? 'Deactivate' : 'Activate'}
            </Button>
          )}
          {u.role === 'COACH' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                setResetTarget(u);
                setNewPassword('');
              }}
              title="Reset password"
            >
              <KeyRound className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setAuditUser(u)}
            title="View audit trail"
          >
            <ClipboardList className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  const filterButtons: { id: UserFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'admin', label: 'Admins' },
    { id: 'coach', label: 'Coaches' },
    { id: 'pending', label: 'Pending approval' },
  ];

  return (
    <AdminLayout title="Users">
      <div className="mb-4 flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <Button
            key={btn.id}
            variant={filter === btn.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(btn.id)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="Users"
          data={users}
          columns={columns}
          onAdd={() => setCreateOpen(true)}
          onEdit={formDialog.openEdit}
          onDelete={(u) => setDeleteTarget(u)}
          searchKeys={['first_name', 'last_name', 'email']}
        />
      </QueryState>

      <UserCreateFormDialog open={createOpen} onOpenChange={setCreateOpen} />

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
            toast.success('User deleted.');
            setDeleteTarget(null);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to delete user'));
          }
        }}
      />

      <FormDialog
        open={!!resetTarget}
        onOpenChange={(open) => { if (!open) setResetTarget(null); }}
        title="Reset coach password"
        description={resetTarget ? `Set a new password for ${resetTarget.email}` : undefined}
        onSubmit={() => {
          if (!resetTarget || newPassword.length < 8) return;
          void (async () => {
            try {
              await resetPasswordMutation.mutateAsync({
                id: resetTarget.id,
                password: newPassword,
              });
              toast.success('Password reset.');
              setResetTarget(null);
              setNewPassword('');
            } catch (err) {
              toast.error(getApiErrorMessage(err, 'Failed to reset password'));
            }
          })();
        }}
        isSubmitting={resetPasswordMutation.isPending}
        submitLabel="Reset password"
      >
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
      </FormDialog>
    </AdminLayout>
  );
}
