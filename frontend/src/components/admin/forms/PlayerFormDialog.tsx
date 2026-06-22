import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, FormError } from '@/components/admin/form-fields';
import { playerSchema, type PlayerFormValues } from '@/lib/schemas/admin';
import { useCreateTeamPlayer, useUpdateTeamPlayer } from '@/hooks/useTeamPlayers';
import { getApiErrorMessage } from '@/lib/errors';
import type { Player } from '@/types';

interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  player?: Player | null;
  onSuccess?: (player: Player) => void;
}

export default function PlayerFormDialog({
  open,
  onOpenChange,
  teamId,
  player,
  onSuccess,
}: PlayerFormDialogProps) {
  const createMutation = useCreateTeamPlayer();
  const updateMutation = useUpdateTeamPlayer();
  const isEditing = !!player;
  const [apiError, setApiError] = useState('');

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      jersey_number: '',
      preferred_position: '',
      profile_image: '',
    },
  });

  useEffect(() => {
    if (!open) {
      setApiError('');
      return;
    }
    if (player) {
      form.reset({
        first_name: player.first_name,
        last_name: player.last_name,
        jersey_number: player.jersey_number != null ? String(player.jersey_number) : '',
        preferred_position: player.preferred_position ?? '',
        profile_image: player.profile_image ?? '',
      });
    } else {
      form.reset({
        first_name: '',
        last_name: '',
        jersey_number: '',
        preferred_position: '',
        profile_image: '',
      });
    }
  }, [open, player, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError('');
    try {
      const payload = {
        ...values,
        profile_image: values.profile_image || undefined,
        jersey_number: values.jersey_number ? Number(values.jersey_number) : undefined,
        preferred_position: values.preferred_position || undefined,
      };
      if (isEditing && player) {
        const res = await updateMutation.mutateAsync({
          teamId,
          playerId: player.id,
          data: payload,
        });
        onOpenChange(false);
        onSuccess?.(res.data);
      } else {
        const res = await createMutation.mutateAsync({ teamId, data: payload });
        onOpenChange(false);
        onSuccess?.(res.data);
      }
    } catch (err) {
      const message = getApiErrorMessage(err);
      setApiError(message);
      form.setError('root', { message });
    }
  });

  const fieldErrors = form.formState.errors;

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setApiError('');
        onOpenChange(next);
      }}
      title={isEditing ? 'Edit Player' : 'Add Player'}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
    >
      {(apiError || fieldErrors.root?.message) && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {apiError || fieldErrors.root?.message}
        </div>
      )}

      <FormError message={undefined} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextInputField control={form.control} name="first_name" label="First Name" />
        <TextInputField control={form.control} name="last_name" label="Last Name" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextInputField control={form.control} name="jersey_number" label="Jersey #" type="number" />
        <TextInputField control={form.control} name="preferred_position" label="Position" placeholder="e.g. Forward" />
      </div>

      <TextInputField control={form.control} name="profile_image" label="Photo URL" placeholder="https://…" />
    </FormDialog>
  );
}
