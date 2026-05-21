import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { SelectField, FormError, TextInputField } from '@/components/admin/form-fields';
import { userRoleSchema, type UserRoleFormValues } from '@/lib/schemas/admin';
import { useUpdateUser, useLinkUserEntity } from '@/hooks/useUsers';
import { getApiErrorMessage } from '@/lib/errors';
import type { User } from '@/types';
import { z } from 'zod';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TOURNAMENT_ADMIN', label: 'Tournament Admin' },
  { value: 'COACH', label: 'Coach' },
  { value: 'REFEREE', label: 'Referee' },
  { value: 'PLAYER', label: 'Player' },
  { value: 'VIEWER', label: 'Viewer' },
];

const linkSchema = z.object({
  entity_type: z.enum(['player', 'coach', 'referee']),
  entity_id: z.string().min(1, 'Entity ID is required'),
});

type LinkFormValues = z.infer<typeof linkSchema>;

interface UserRoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export default function UserRoleFormDialog({ open, onOpenChange, user }: UserRoleFormDialogProps) {
  const updateMutation = useUpdateUser();
  const linkMutation = useLinkUserEntity();

  const form = useForm<UserRoleFormValues>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: { role: 'VIEWER' },
  });

  const linkForm = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: { entity_type: 'coach', entity_id: '' },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({ role: user.role });
      linkForm.reset({ entity_type: 'coach', entity_id: '' });
    }
  }, [open, user, form, linkForm]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      await updateMutation.mutateAsync({ id: user.id, data: { role: values.role } });
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  const onLink = linkForm.handleSubmit(async (values) => {
    if (!user) return;
    try {
      await linkMutation.mutateAsync({
        id: user.id,
        entity_type: values.entity_type,
        entity_id: values.entity_id,
      });
      linkForm.reset({ entity_type: values.entity_type, entity_id: '' });
    } catch (err) {
      linkForm.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  if (!user) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit User"
      description={`${user.first_name} ${user.last_name} (${user.email})`}
      onSubmit={onSubmit}
      isSubmitting={updateMutation.isPending}
      submitLabel="Update Role"
    >
      <FormError message={form.formState.errors.root?.message} />
      <SelectField control={form.control} name="role" label="Role" options={ROLE_OPTIONS} />

      <div className="mt-6 border-t border-border pt-4 space-y-3">
        <p className="text-sm font-medium text-foreground m-0">Link profile entity</p>
        <FormError message={linkForm.formState.errors.root?.message} />
        <SelectField
          control={linkForm.control}
          name="entity_type"
          label="Entity type"
          options={[
            { value: 'player', label: 'Player' },
            { value: 'coach', label: 'Coach' },
            { value: 'referee', label: 'Referee' },
          ]}
        />
        <TextInputField control={linkForm.control} name="entity_id" label="Entity ID (UUID)" />
        <button
          type="button"
          onClick={onLink}
          disabled={linkMutation.isPending}
          className="inline-flex h-9 items-center rounded-md border border-border bg-white px-3 text-sm font-medium hover:bg-muted"
        >
          {linkMutation.isPending ? 'Linking…' : 'Link entity'}
        </button>
      </div>
    </FormDialog>
  );
}
