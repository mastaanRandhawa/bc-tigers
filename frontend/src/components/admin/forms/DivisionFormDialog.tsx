import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import {
  TextInputField,
  SelectField,
  SearchableSelectField,
  FormError,
} from '@/components/admin/form-fields';
import { divisionSchema, type DivisionFormValues } from '@/lib/schemas/admin';
import { useCreateDivision, useUpdateDivision } from '@/hooks/useDivisions';
import { useTournaments } from '@/hooks/useTournaments';
import { usePointFormats } from '@/hooks/usePointFormats';
import { slugify } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  const { data: pointFormats = [] } = usePointFormats();
  const createMutation = useCreateDivision();
  const updateMutation = useUpdateDivision();
  const isEditing = !!division;
  const [scheduleOnly, setScheduleOnly] = useState(false);
  const [groupsEnabled, setGroupsEnabled] = useState(false);

  const defaultFormatId =
    pointFormats.find((pf) => pf.slug === 'standard-soccer-3-point')?.id ??
    pointFormats[0]?.id ??
    '';

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
      point_format_id: defaultFormatId,
      primary_color: '#F48735',
      accent_color: '#FEF3EB',
      display_order: '0',
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
        point_format_id: division.point_format_id,
        primary_color: division.primary_color ?? '#F48735',
        accent_color: division.accent_color ?? '#FEF3EB',
        display_order: String(division.display_order ?? 0),
      });
      setScheduleOnly(division.schedule_only ?? false);
      setGroupsEnabled(division.groups_enabled ?? false);
    } else {
      form.reset({
        tournament_id: tournaments[0]?.id ?? '',
        name: '',
        slug: '',
        age_group: '',
        gender: 'MALE',
        max_teams: '8',
        format: 'Round Robin',
        point_format_id: defaultFormatId,
        primary_color: '#F48735',
        accent_color: '#FEF3EB',
        display_order: '0',
      });
      setScheduleOnly(false);
      setGroupsEnabled(false);
    }
  }, [open, division, form, tournaments, defaultFormatId]);

  const name = form.watch('name');
  useEffect(() => {
    if (!isEditing && name) form.setValue('slug', slugify(name));
  }, [name, isEditing, form]);

  const formatOptions = pointFormats.map((pf) => ({
    value: pf.id,
    label: pf.name,
    description: pf.description ?? undefined,
  }));

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        max_teams: Number(values.max_teams),
        display_order: Number(values.display_order ?? 0),
        schedule_only: scheduleOnly,
        groups_enabled: groupsEnabled,
      };
      if (isEditing && division) {
        await updateMutation.mutateAsync({ id: division.id, data: payload });
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
      <SearchableSelectField
        control={form.control}
        name="point_format_id"
        label="Point format"
        options={formatOptions}
        placeholder="Search point formats..."
      />
      <TextInputField control={form.control} name="primary_color" label="Primary Color" placeholder="#F48735" />
      <TextInputField control={form.control} name="accent_color" label="Accent Color" placeholder="#FEF3EB" />
      <TextInputField
        control={form.control}
        name="display_order"
        label="Display order"
        type="number"
        placeholder="0"
      />
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label>Schedule only (kids)</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Hides scores, standings, brackets, and stats on the public site. Only the schedule is shown.
          </p>
        </div>
        <Switch checked={scheduleOnly} onCheckedChange={setScheduleOnly} />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label>Enable groups (pools)</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Splits this division into groups so teams, fixtures, and standings are
            organized into separate pools. Use “Groups” on the division card to
            create pools and assign teams.
          </p>
        </div>
        <Switch checked={groupsEnabled} onCheckedChange={setGroupsEnabled} />
      </div>
    </FormDialog>
  );
}
