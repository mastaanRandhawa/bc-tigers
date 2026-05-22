import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import { teamSchema, type TeamFormValues } from '@/lib/schemas/admin';
import { useCreateTeam, useUpdateTeam } from '@/hooks/useTeams';
import { useDivisions } from '@/hooks/useDivisions';
import { slugify } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import type { Team } from '@/types';

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
  /** Pre-fill division when creating a new team from a division context */
  defaultDivisionId?: string;
}

export default function TeamFormDialog({ open, onOpenChange, team, defaultDivisionId }: TeamFormDialogProps) {
  const { data: divisions = [] } = useDivisions();
  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();
  const isEditing = !!team;

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      division_id: '',
      name: '',
      slug: '',
      city: '',
      primary_color: '#F48735',
      secondary_color: '#F48735',
      logo: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (team) {
      form.reset({
        division_id: team.division_id,
        name: team.name,
        slug: team.slug,
        city: team.city ?? '',
        primary_color: team.primary_color ?? '#F48735',
        secondary_color: team.secondary_color ?? '',
        logo: team.logo ?? '',
      });
    } else {
      form.reset({
        division_id: defaultDivisionId ?? divisions[0]?.id ?? '',
        name: '',
        slug: '',
        city: '',
        primary_color: '#F48735',
        secondary_color: '#F48735',
        logo: '',
      });
    }
  }, [open, team, form, divisions, defaultDivisionId]);

  const name = form.watch('name');
  useEffect(() => {
    if (!isEditing && name) form.setValue('slug', slugify(name));
  }, [name, isEditing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = { ...values, logo: values.logo || undefined };
      if (isEditing && team) {
        await updateMutation.mutateAsync({ id: team.id, data: payload });
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
      title={isEditing ? 'Edit Team' : 'Create Team'}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
    >
      <FormError message={form.formState.errors.root?.message} />
      <SelectField
        control={form.control}
        name="division_id"
        label="Division"
        options={divisions.map((d) => ({ value: d.id, label: d.name }))}
      />
      <TextInputField control={form.control} name="name" label="Team Name" />
      <TextInputField control={form.control} name="slug" label="Slug" />
      <TextInputField control={form.control} name="city" label="City" />
      <div className="grid grid-cols-2 gap-3">
        <TextInputField control={form.control} name="primary_color" label="Primary Color" type="color" />
        <TextInputField control={form.control} name="secondary_color" label="Secondary Color" type="color" />
      </div>
      <TextInputField control={form.control} name="logo" label="Logo URL" placeholder="https://..." />
    </FormDialog>
  );
}
