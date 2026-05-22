import { useCallback, useState } from 'react';
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
import { useDeleteTeam } from '@/hooks/useTeams';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { Team } from '@/types';

export default function DivisionTeamsPage() {
  const { tournamentSlug, divisionSlug, division } = useDivisionRoute();
  const { data: teams = [], isLoading, isError, refetch } = useDivisionTeams(
    tournamentSlug,
    divisionSlug,
  );

  const canEdit = useCanAdminEdit();
  const teamDialog = useFormDialog<Team>();
  const deleteMutation = useDeleteTeam();
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const qc = useQueryClient();

  const getText = useCallback((t: (typeof teams)[0]) => teamSearchText(t), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(teams, getText);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    qc.invalidateQueries({ queryKey: ['division-resources'] });
    setDeleteTarget(null);
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
        title="Delete team?"
        description={`"${deleteTarget?.name}" will be permanently removed from this division.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
