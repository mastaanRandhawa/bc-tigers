import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, TextareaField, SelectField, FormError } from '@/components/admin/form-fields';
import { tournamentSchema, type TournamentFormValues } from '@/lib/schemas/admin';
import { useCreateTournament, useUpdateTournament } from '@/hooks/useTournaments';
import { useAuthStore } from '@/store/authStore';
import { slugify } from '@/lib/utils';
import { toDateInput, fromDateInput } from '@/lib/datetime';
import { getApiErrorMessage } from '@/lib/errors';
import type { Tournament } from '@/types';

const STATUS_OPTIONS = [
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { value: 'ROUND_ROBIN', label: 'Round Robin' },
  { value: 'KNOCKOUT', label: 'Knockout' },
  { value: 'GROUP_STAGE_PLUS_KNOCKOUT', label: 'Group + Knockout' },
  { value: 'LEAGUE', label: 'League' },
  { value: 'HYBRID', label: 'Hybrid' },
];

interface TournamentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament?: Tournament | null;
}

export default function TournamentFormDialog({ open, onOpenChange, tournament }: TournamentFormDialogProps) {
  const user = useAuthStore((s) => s.user);
  const createMutation = useCreateTournament();
  const updateMutation = useUpdateTournament();
  const isEditing = !!tournament;

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      location: '',
      start_date: '',
      end_date: '',
      status: 'UPCOMING',
      tournament_type: 'ROUND_ROBIN',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (tournament) {
      form.reset({
        name: tournament.name,
        slug: tournament.slug,
        description: tournament.description ?? '',
        location: tournament.location,
        start_date: toDateInput(tournament.start_date),
        end_date: toDateInput(tournament.end_date),
        status: tournament.status,
        tournament_type: tournament.tournament_type,
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        status: 'UPCOMING',
        tournament_type: 'ROUND_ROBIN',
      });
    }
  }, [open, tournament, form]);

  const name = form.watch('name');
  useEffect(() => {
    if (!isEditing && name) {
      form.setValue('slug', slugify(name));
    }
  }, [name, isEditing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        start_date: fromDateInput(values.start_date),
        end_date: fromDateInput(values.end_date),
      };

      if (isEditing && tournament) {
        await updateMutation.mutateAsync({ id: tournament.id, data: payload });
      } else {
        await createMutation.mutateAsync({
          ...payload,
          created_by: user?.id ?? '',
        });
      }
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Tournament' : 'Create Tournament'}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEditing ? 'Update' : 'Create'}
    >
      <FormError message={form.formState.errors.root?.message} />
      <TextInputField control={form.control} name="name" label="Name" />
      <TextInputField control={form.control} name="slug" label="Slug" />
      <TextareaField control={form.control} name="description" label="Description" />
      <TextInputField control={form.control} name="location" label="Location" />
      <div className="grid grid-cols-2 gap-3">
        <TextInputField control={form.control} name="start_date" label="Start Date" type="date" />
        <TextInputField control={form.control} name="end_date" label="End Date" type="date" />
      </div>
      <SelectField control={form.control} name="status" label="Status" options={STATUS_OPTIONS} />
      <SelectField control={form.control} name="tournament_type" label="Format" options={TYPE_OPTIONS} />
    </FormDialog>
  );
}
