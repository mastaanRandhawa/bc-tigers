import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import { playerSchema, type PlayerFormValues } from '@/lib/schemas/admin';
import { useCreatePlayer, useUpdatePlayer } from '@/hooks/usePlayers';
import { slugify } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import type { Player } from '@/types';

interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player | null;
}

export default function PlayerFormDialog({ open, onOpenChange, player }: PlayerFormDialogProps) {
  const createMutation = useCreatePlayer();
  const updateMutation = useUpdatePlayer();
  const isEditing = !!player;

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      slug: '',
      nationality: '',
      jersey_number: undefined,
      preferred_position: '',
      profile_image: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (player) {
      form.reset({
        first_name: player.first_name,
        last_name: player.last_name,
        slug: player.slug,
        nationality: player.nationality ?? '',
        jersey_number: player.jersey_number != null ? String(player.jersey_number) : '',
        preferred_position: player.preferred_position ?? '',
        profile_image: player.profile_image ?? '',
      });
    } else {
      form.reset({
        first_name: '',
        last_name: '',
        slug: '',
        nationality: '',
        jersey_number: '',
        preferred_position: '',
        profile_image: '',
      });
    }
  }, [open, player, form]);

  const firstName = form.watch('first_name');
  const lastName = form.watch('last_name');
  useEffect(() => {
    if (!isEditing && firstName && lastName) {
      form.setValue('slug', slugify(`${firstName}-${lastName}`));
    }
  }, [firstName, lastName, isEditing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        profile_image: values.profile_image || undefined,
        jersey_number: values.jersey_number ? Number(values.jersey_number) : undefined,
      };
      if (isEditing && player) {
        await updateMutation.mutateAsync({ id: player.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Player' : 'Create Player'}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
    >
      <FormError message={form.formState.errors.root?.message} />
      <div className="grid grid-cols-2 gap-3">
        <TextInputField control={form.control} name="first_name" label="First Name" />
        <TextInputField control={form.control} name="last_name" label="Last Name" />
      </div>
      <TextInputField control={form.control} name="slug" label="Slug" />
      <div className="grid grid-cols-2 gap-3">
        <TextInputField control={form.control} name="jersey_number" label="Jersey #" type="number" />
        <TextInputField control={form.control} name="preferred_position" label="Position" />
      </div>
      <TextInputField control={form.control} name="nationality" label="Nationality" />
      <TextInputField control={form.control} name="profile_image" label="Photo URL" />
    </FormDialog>
  );
}
