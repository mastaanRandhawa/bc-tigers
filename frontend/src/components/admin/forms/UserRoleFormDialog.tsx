import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, FormError } from '@/components/admin/form-fields';
import { userRoleSchema, type UserRoleFormValues } from '@/lib/schemas/admin';
import { useUpdateUser } from '@/hooks/useUsers';
import { getApiErrorMessage } from '@/lib/errors';
import type { User } from '@/types';

interface UserRoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export default function UserRoleFormDialog({ open, onOpenChange, user }: UserRoleFormDialogProps) {
  const updateMutation = useUpdateUser();

  const form = useForm<UserRoleFormValues>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: { first_name: '', last_name: '', email: '', phone: '' },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone ?? '',
      });
    }
  }, [open, user, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        data: {
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone || undefined,
        },
      });
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
      title="Edit User"
      description={`${user.email} · ${user.role === 'COACH' ? 'Coach' : 'Administrator'}`}
      onSubmit={onSubmit}
      isSubmitting={updateMutation.isPending}
      submitLabel="Save changes"
    >
      <FormError message={form.formState.errors.root?.message} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextInputField control={form.control} name="first_name" label="First name" />
        <TextInputField control={form.control} name="last_name" label="Last name" />
      </div>
      <TextInputField control={form.control} name="email" label="Email" disabled />
      <TextInputField control={form.control} name="phone" label="Phone" />
    </FormDialog>
  );
}
