import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import { teamSchema, type TeamFormValues } from '@/lib/schemas/admin';
import { useCreateTeam, useUpdateTeam } from '@/hooks/useTeams';
import { useDivisions } from '@/hooks/useDivisions';
import { useUsers } from '@/hooks/useUsers';
import { slugify } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Team } from '@/types';

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
  defaultDivisionId?: string;
}

export default function TeamFormDialog({ open, onOpenChange, team, defaultDivisionId }: TeamFormDialogProps) {
  const { data: divisions = [] } = useDivisions();
  const { data: coaches = [] } = useUsers({ role: 'COACH', limit: 200 });
  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();
  const isEditing = !!team;
  const [managementLocked, setManagementLocked] = useState(false);

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
      coach_user_id: '',
      contact_email: '',
      contact_phone: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (team) {
      setManagementLocked(team.management_locked ?? false);
      form.reset({
        division_id: team.division_id,
        name: team.name,
        slug: team.slug,
        city: team.city ?? '',
        primary_color: team.primary_color ?? '#F48735',
        secondary_color: team.secondary_color ?? '',
        logo: team.logo ?? '',
        coach_user_id: team.coach_user_id ?? team.coach?.id ?? '',
        contact_email: team.contact_email ?? '',
        contact_phone: team.contact_phone ?? '',
      });
    } else {
      setManagementLocked(false);
      form.reset({
        division_id: defaultDivisionId ?? divisions[0]?.id ?? '',
        name: '',
        slug: '',
        city: '',
        primary_color: '#F48735',
        secondary_color: '#F48735',
        logo: '',
        coach_user_id: '',
        contact_email: '',
        contact_phone: '',
      });
    }
  }, [open, team, form, divisions, defaultDivisionId]);

  const name = form.watch('name');
  useEffect(() => {
    if (!isEditing && name) form.setValue('slug', slugify(name));
  }, [name, isEditing, form]);

  const coachOptions = coaches
    .filter(
      (c) =>
        c.approved &&
        c.active &&
        (!c.coached_team || c.coached_team.id === team?.id),
    )
    .map((c) => ({
      value: c.id,
      label: `${c.first_name} ${c.last_name} (${c.email})`,
    }));

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        logo: values.logo || undefined,
        coach_user_id: values.coach_user_id || null,
        contact_email: values.contact_email || undefined,
        contact_phone: values.contact_phone || undefined,
        ...(isEditing ? { management_locked: managementLocked } : {}),
      };
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
      <TextInputField control={form.control} name="contact_email" label="Contact Email" type="email" />
      <TextInputField control={form.control} name="contact_phone" label="Contact Phone" />
      <SelectField
        control={form.control}
        name="coach_user_id"
        label="Assigned Coach"
        options={[{ value: '', label: 'None — assign later' }, ...coachOptions]}
      />
      <p className="text-xs text-muted-foreground -mt-2">
        Only approved, active coaches without another team appear here. Coaches access their team via Coach Portal after assignment.
      </p>
      {isEditing && (
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label>Lock team management</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prevents the assigned coach from editing this team.
            </p>
          </div>
          <Switch checked={managementLocked} onCheckedChange={setManagementLocked} />
        </div>
      )}
    </FormDialog>
  );
}
