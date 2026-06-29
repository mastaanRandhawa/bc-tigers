import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import SearchableTeamPicker from '@/components/admin/SearchableTeamPicker';
import { teamSchema, type TeamFormValues } from '@/lib/schemas/admin';
import {
  useCreateTeam,
  useUpdateTeam,
  useAddTeamToDivision,
  useRemoveTeamFromDivision,
  useTeams,
} from '@/hooks/useTeams';
import { useDivisions } from '@/hooks/useDivisions';
import { useUsers } from '@/hooks/useUsers';
import { slugify, cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import type { SearchableTeamOption } from '@/lib/team-search';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Team } from '@/types';

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
  defaultDivisionId?: string;
}

type AddMode = 'existing' | 'new';

function uniqueTournamentTeams(
  teams: Team[],
  divisions: Array<{ id: string; name: string; tournament_id: string; tournament?: { name: string } }>,
  tournamentId: string,
): Map<string, { team: Team; divisionNames: string[]; divisionIds: string[] }> {
  const byId = new Map<string, { team: Team; divisionNames: string[]; divisionIds: string[] }>();

  for (const row of teams) {
    const division = divisions.find((d) => d.id === row.division_id);
    if (!division || division.tournament_id !== tournamentId) continue;

    const existing = byId.get(row.id);
    if (!existing) {
      byId.set(row.id, {
        team: row,
        divisionNames: [division.name],
        divisionIds: [row.division_id],
      });
      continue;
    }

    if (!existing.divisionIds.includes(row.division_id)) {
      existing.divisionIds.push(row.division_id);
      existing.divisionNames.push(division.name);
    }
  }

  return byId;
}

export default function TeamFormDialog({ open, onOpenChange, team, defaultDivisionId }: TeamFormDialogProps) {
  const { data: divisions = [] } = useDivisions();
  const { data: allTeams = [] } = useTeams();
  const { data: coaches = [] } = useUsers({ role: 'COACH', limit: 200 });
  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();
  const addToDivision = useAddTeamToDivision();
  const removeFromDivision = useRemoveTeamFromDivision();
  const isEditing = !!team;
  const [managementLocked, setManagementLocked] = useState(false);
  const [addDivisionId, setAddDivisionId] = useState('');
  const [addMode, setAddMode] = useState<AddMode>('existing');
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      division_id: '',
      division_ids: [],
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

  const primaryDivisionId = form.watch('division_id');
  const targetDivisionId = defaultDivisionId ?? primaryDivisionId;
  const targetDivision = divisions.find((d) => d.id === targetDivisionId);
  const tournamentId = targetDivision?.tournament_id;

  const memberDivisionIds = useMemo(() => {
    if (!team) return [];
    return team.division_ids ?? (team.division_id ? [team.division_id] : []);
  }, [team]);

  const addableDivisions = useMemo(() => {
    if (!team || !targetDivision) return [];
    return divisions.filter(
      (d) =>
        d.tournament_id === targetDivision.tournament_id &&
        !memberDivisionIds.includes(d.id),
    );
  }, [team, divisions, memberDivisionIds, targetDivision]);

  const searchableTeams = useMemo((): SearchableTeamOption[] => {
    if (!tournamentId || !targetDivisionId) return [];

    const grouped = uniqueTournamentTeams(allTeams, divisions, tournamentId);
    return [...grouped.values()]
      .filter(({ divisionIds }) => !divisionIds.includes(targetDivisionId))
      .map(({ team: t, divisionNames }) => ({
        id: t.id,
        name: t.name,
        division: {
          id: t.division_id,
          name: divisionNames.join(', '),
          tournament: targetDivision.tournament
            ? { name: targetDivision.tournament.name }
            : undefined,
        },
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allTeams, divisions, tournamentId, targetDivisionId, targetDivision]);

  const selectedTeam = useMemo(
    () => searchableTeams.find((t) => t.id === selectedTeamId),
    [searchableTeams, selectedTeamId],
  );

  useEffect(() => {
    if (!open) return;
    if (team) {
      setManagementLocked(team.management_locked ?? false);
      setAddDivisionId('');
      form.reset({
        division_id: team.division_id,
        division_ids: [],
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
      setAddDivisionId('');
      setAddMode(defaultDivisionId ? 'existing' : 'new');
      setSelectedTeamId('');
      form.reset({
        division_id: defaultDivisionId ?? divisions[0]?.id ?? '',
        division_ids: [],
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
    if (!isEditing && addMode === 'new' && name) form.setValue('slug', slugify(name));
  }, [name, isEditing, addMode, form]);

  const coachOptions = coaches
    .filter((c) => c.approved && c.active)
    .map((c) => ({
      value: c.id,
      label: `${c.first_name} ${c.last_name} (${c.email})`,
    }));

  const handleAddExisting = async () => {
    if (!selectedTeamId || !targetDivisionId) return;
    try {
      const teamName = selectedTeam?.name ?? 'team';
      await addToDivision.mutateAsync({
        teamId: selectedTeamId,
        data: { division_id: targetDivisionId, slug: slugify(teamName) },
      });
      toast.success(`Added ${teamName} to ${targetDivision?.name ?? 'division'}.`);
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  };

  const submitCreateNew = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        city: values.city || null,
        primary_color: values.primary_color,
        secondary_color: values.secondary_color || null,
        logo: values.logo || null,
        coach_user_id: values.coach_user_id || null,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
      };
      await createMutation.mutateAsync({
        ...payload,
        division_id: defaultDivisionId ?? values.division_id,
      });
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  const submitEdit = form.handleSubmit(async (values) => {
    if (!team) return;
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        city: values.city || null,
        primary_color: values.primary_color,
        secondary_color: values.secondary_color || null,
        logo: values.logo || null,
        coach_user_id: values.coach_user_id || null,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
        management_locked: managementLocked,
      };
      await updateMutation.mutateAsync({ id: team.id, data: payload });
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  const onSubmit = () => {
    form.clearErrors('root');
    if (!isEditing && addMode === 'existing') {
      void handleAddExisting();
      return;
    }
    if (isEditing) {
      void submitEdit();
      return;
    }
    void submitCreateNew();
  };

  const handleAddDivision = async () => {
    if (!team || !addDivisionId) return;
    try {
      await addToDivision.mutateAsync({
        teamId: team.id,
        data: { division_id: addDivisionId, slug: slugify(team.name) },
      });
      toast.success('Team added to division.');
      setAddDivisionId('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to add team to division'));
    }
  };

  const handleRemoveDivision = async (divisionId: string) => {
    if (!team) return;
    try {
      await removeFromDivision.mutateAsync({ teamId: team.id, divisionId });
      toast.success('Team removed from division.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to remove team from division'));
    }
  };

  const divisionName = (id: string) => divisions.find((d) => d.id === id)?.name ?? id;

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || addToDivision.isPending;

  const dialogTitle = isEditing
    ? 'Edit Team'
    : addMode === 'existing'
      ? 'Add Team to Division'
      : 'Create Team';

  const submitLabel = isEditing
    ? 'Save'
    : addMode === 'existing'
      ? 'Add to division'
      : 'Create team';

  const submitDisabled =
    isSubmitting ||
    (!isEditing && addMode === 'existing' && (!selectedTeamId || !targetDivisionId));

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitDisabled={submitDisabled}
      submitLabel={submitLabel}
    >
      <FormError message={form.formState.errors.root?.message} />

      {!isEditing && (
        <>
          <div className="flex gap-1 rounded-lg border border-border p-1">
            <button
              type="button"
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                addMode === 'existing'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setAddMode('existing')}
            >
              Add existing
            </button>
            <button
              type="button"
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                addMode === 'new'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setAddMode('new')}
            >
              Create new
            </button>
          </div>

          {addMode === 'existing' ? (
            <div className="space-y-2">
              {defaultDivisionId && targetDivision ? (
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Adding to</p>
                  <p className="text-sm font-medium text-foreground">{targetDivision.name}</p>
                </div>
              ) : (
                <SelectField
                  control={form.control}
                  name="division_id"
                  label="Division"
                  options={divisions.map((d) => ({ value: d.id, label: d.name }))}
                />
              )}
              <Label htmlFor="add-team-search">Search teams in this tournament</Label>
              <SearchableTeamPicker
                id="add-team-search"
                teams={searchableTeams}
                value={selectedTeamId}
                onChange={setSelectedTeamId}
                searchPlaceholder="Search by team or division…"
                emptyMessage={
                  targetDivisionId
                    ? 'No teams found. Switch to Create new to add one.'
                    : 'Select a division first.'
                }
              />
              <p className="text-xs text-muted-foreground">
                Teams already in this division are hidden. Pick one to register it here.
              </p>
            </div>
          ) : (
            <>
              {defaultDivisionId && targetDivision ? (
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Division</p>
                  <p className="text-sm font-medium text-foreground">{targetDivision.name}</p>
                </div>
              ) : (
                <SelectField
                  control={form.control}
                  name="division_id"
                  label="Division"
                  options={divisions.map((d) => ({ value: d.id, label: d.name }))}
                />
              )}
            </>
          )}
        </>
      )}

      {isEditing && memberDivisionIds.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <Label>Registered divisions</Label>
          <div className="flex flex-wrap gap-2">
            {memberDivisionIds.map((id) => (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {divisionName(id)}
                {memberDivisionIds.length > 1 && (
                  <button
                    type="button"
                    className="ml-1 rounded px-1 text-xs hover:bg-muted"
                    onClick={() => void handleRemoveDivision(id)}
                    aria-label={`Remove from ${divisionName(id)}`}
                  >
                    ×
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {addableDivisions.length > 0 && (
            <div className="flex gap-2 pt-1">
              <select
                value={addDivisionId}
                onChange={(e) => setAddDivisionId(e.target.value)}
                className="h-9 flex-1 rounded-md border border-border bg-card px-2 text-sm"
              >
                <option value="">Add to division…</option>
                {addableDivisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!addDivisionId || addToDivision.isPending}
                onClick={() => void handleAddDivision()}
              >
                Add
              </Button>
            </div>
          )}
        </div>
      )}

      {(isEditing || addMode === 'new') && (
        <>
          <TextInputField control={form.control} name="name" label="Team Name" />
          {!isEditing && (
            <TextInputField control={form.control} name="slug" label="Slug (in this division)" />
          )}
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
            Approved, active coaches may be assigned to multiple teams. Each team can have only one coach.
          </p>
        </>
      )}

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
