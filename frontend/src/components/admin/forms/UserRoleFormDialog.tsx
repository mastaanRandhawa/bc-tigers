import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { SelectField, FormError } from '@/components/admin/form-fields';
import { userRoleSchema, type UserRoleFormValues } from '@/lib/schemas/admin';
import { useUpdateUser } from '@/hooks/useUsers';
import { getApiErrorMessage } from '@/lib/errors';
import type { User } from '@/types';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TOURNAMENT_ADMIN', label: 'Tournament Admin' },
  { value: 'COACH', label: 'Coach' },
  { value: 'REFEREE', label: 'Referee' },
  { value: 'PLAYER', label: 'Player' },
  { value: 'VIEWER', label: 'Viewer' },
];

interface UserRoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export default function UserRoleFormDialog({ open, onOpenChange, user }: UserRoleFormDialogProps) {
  const updateMutation = useUpdateUser();

  const form = useForm<UserRoleFormValues>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: { role: 'VIEWER' },
  });

  useEffect(() => {
    if (open && user) form.reset({ role: user.role });
  }, [open, user, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      await updateMutation.mutateAsync({ id: user.id, data: { role: values.role } });
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  if (!user) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit User Role"
      description={`${user.first_name} ${user.last_name} (${user.email})`}
      onSubmit={onSubmit}
      isSubmitting={updateMutation.isPending}
      submitLabel="Update Role"
    >
      <FormError message={form.formState.errors.root?.message} />
      <SelectField control={form.control} name="role" label="Role" options={ROLE_OPTIONS} />
    </FormDialog>
  );
}
