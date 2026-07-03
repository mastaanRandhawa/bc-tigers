import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TeamCard from '@/components/teams/TeamCard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import ResourceList from '@/components/shared/ResourceList';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTeams } from '@/hooks/useDivisionResources';
import { useListSearch } from '@/hooks/useListSearch';
import { teamSearchText } from '@/lib/search-text';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { AdminContextBar } from '@/components/admin/inline/AdminContextBar';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import TeamFormDialog from '@/components/admin/forms/TeamFormDialog';
import { useRemoveTeamFromDivision } from '@/hooks/useTeams';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Team } from '@/types';

/** Bucket teams by their group, sorted by group order; unassigned teams last. */
function groupTeams(teams: Team[]) {
  const buckets = new Map<
    string,
    { key: string; name: string; order: number; teams: Team[] }
  >();
  const unassigned: Team[] = [];
  for (const t of teams) {
    if (t.group) {
      const bucket =
        buckets.get(t.group.id) ??
        { key: t.group.id, name: t.group.name, order: t.group.order, teams: [] };
      bucket.teams.push(t);
      buckets.set(t.group.id, bucket);
    } else {
      unassigned.push(t);
    }
  }
  const result = [...buckets.values()].sort((a, b) => a.order - b.order);
  if (unassigned.length > 0) {
    result.push({ key: '__unassigned', name: 'Unassigned', order: 999, teams: unassigned });
  }
  return result;
}

export default function DivisionTeamsPage() {
  const { tournamentSlug, divisionSlug, division } = useDivisionRoute();
  const [searchParams] = useSearchParams();
  const { data: teams = [], isLoading, isError, refetch } = useDivisionTeams(
    tournamentSlug,
    divisionSlug,
  );

  const canEdit = useCanAdminEdit();
  const teamDialog = useFormDialog<Team>();
  const removeMutation = useRemoveTeamFromDivision();
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const qc = useQueryClient();

  const getText = useCallback((t: (typeof teams)[0]) => teamSearchText(t), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    teams,
    getText,
    searchParams.get('q') ?? '',
  );

  const handleDelete = async () => {
    if (!deleteTarget || !division?.id) return;
    try {
      await removeMutation.mutateAsync({
        teamId: deleteTarget.id,
        divisionId: division.id,
      });
      qc.invalidateQueries({ queryKey: ['division-resources'] });
      setDeleteTarget(null);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to remove team from division.';
      toast.error(message);
    }
  };

  return (
    <>
      <DivisionPageHeader title="Teams" subtitle="Registered squads in this division" />

      <AdminContextBar
        label="Editing teams"
        advancedHref="/admin/teams"
        advancedLabel="All teams"
        actions={
          <AdminActionButton onClick={teamDialog.openCreate}>
            <Plus className="h-3 w-3" />
            Add team
          </AdminActionButton>
        }
      />

      <ResourceList
        items={filtered}
        totalCount={teams.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search teams…"
        debouncedSearch={debouncedSearch}
        hasQuery={hasQuery}
        entityLabel="teams"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No teams in this division."
      >
        {division.groups_enabled && filtered.some((t) => t.group) ? (
          <div className="space-y-6">
            {groupTeams(filtered).map(({ key, name, teams: groupedTeams }) => (
              <div key={key} className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {name}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      tournamentSlug={tournamentSlug}
                      divisionSlug={divisionSlug}
                      onEdit={canEdit ? teamDialog.openEdit : undefined}
                      onDelete={canEdit ? setDeleteTarget : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                tournamentSlug={tournamentSlug}
                divisionSlug={divisionSlug}
                onEdit={canEdit ? teamDialog.openEdit : undefined}
                onDelete={canEdit ? setDeleteTarget : undefined}
              />
            ))}
          </div>
        )}
      </ResourceList>

      {/* Dialogs */}
      <TeamFormDialog
        open={teamDialog.open}
        onOpenChange={teamDialog.setOpen}
        team={teamDialog.editing}
        defaultDivisionId={division.id}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Remove team from division?"
        description={`"${deleteTarget?.name}" will be removed from this division. The team itself is not deleted and can be re-added.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
