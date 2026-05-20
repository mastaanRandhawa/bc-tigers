import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import { divisionSchema, type DivisionFormValues } from '@/lib/schemas/admin';
import { useCreateDivision, useUpdateDivision } from '@/hooks/useDivisions';
import { useTournaments } from '@/hooks/useTournaments';
import { slugify } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import type { Division } from '@/types';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'MIXED', label: 'Mixed' },
];

interface DivisionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division?: Division | null;
}

export default function DivisionFormDialog({ open, onOpenChange, division }: DivisionFormDialogProps) {
  const { data: tournaments = [] } = useTournaments();
  const createMutation = useCreateDivision();
  const updateMutation = useUpdateDivision();
  const isEditing = !!division;

  const form = useForm<DivisionFormValues>({
    resolver: zodResolver(divisionSchema),
    defaultValues: {
      tournament_id: '',
      name: '',
      slug: '',
      age_group: '',
      gender: 'MALE',
      max_teams: '8',
      format: 'Round Robin',
      primary_color: '#F48735',
      accent_color: '#FEF3EB',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (division) {
      form.reset({
        tournament_id: division.tournament_id,
        name: division.name,
        slug: division.slug,
        age_group: division.age_group ?? '',
        gender: division.gender,
        max_teams: String(division.max_teams),
        format: division.format,
        primary_color: division.primary_color ?? '#F48735',
        accent_color: division.accent_color ?? '#FEF3EB',
      });
    } else {
      form.reset({
        tournament_id: tournaments[0]?.id ?? '',
        name: '',
        slug: '',
        age_group: '',
        gender: 'MALE',
        max_teams: '8',
        format: 'Round Robin',
        primary_color: '#F48735',
        accent_color: '#FEF3EB',
      });
    }
  }, [open, division, form, tournaments]);

  const name = form.watch('name');
  useEffect(() => {
    if (!isEditing && name) form.setValue('slug', slugify(name));
  }, [name, isEditing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEditing && division) {
        await updateMutation.mutateAsync({
          id: division.id,
          data: { ...values, max_teams: Number(values.max_teams) },
        });
      } else {
        await createMutation.mutateAsync({ ...values, max_teams: Number(values.max_teams) });
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
      title={isEditing ? 'Edit Division' : 'Create Division'}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
    >
      <FormError message={form.formState.errors.root?.message} />
      <SelectField
        control={form.control}
        name="tournament_id"
        label="Tournament"
        options={tournaments.map((t) => ({ value: t.id, label: t.name }))}
      />
      <TextInputField control={form.control} name="name" label="Name" />
      <TextInputField control={form.control} name="slug" label="Slug" />
      <TextInputField control={form.control} name="age_group" label="Age Group" placeholder="U18" />
      <SelectField control={form.control} name="gender" label="Gender" options={GENDER_OPTIONS} />
      <TextInputField control={form.control} name="max_teams" label="Max Teams" type="number" />
      <TextInputField control={form.control} name="format" label="Format" />
      <TextInputField control={form.control} name="primary_color" label="Primary Color" placeholder="#F48735" />
      <TextInputField control={form.control} name="accent_color" label="Accent Color" placeholder="#FEF3EB" />
    </FormDialog>
  );
}
