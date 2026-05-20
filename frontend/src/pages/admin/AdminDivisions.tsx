import AdminLayout from '@/components/AdminLayout';
import QueryState from '@/components/shared/QueryState';
import DivisionFormDialog from '@/components/admin/forms/DivisionFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useDivisions, useDeleteDivision } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import type { Division } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { getDivisionPublicPath } from '@/lib/division-routes';
import { getDivisionTheme } from '@/lib/division-theme';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDivisions() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();
  const { data: teams = [] } = useTeams();
  const { data: matches = [] } = useMatches();
  const deleteMutation = useDeleteDivision();
  const formDialog = useFormDialog<Division>();

  const handleDelete = async (d: Division) => {
    if (!confirm(`Delete "${d.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(d.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete division'));
    }
  };

  return (
    <AdminLayout title="Divisions">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <div className="flex justify-end mb-4">
          <Button onClick={formDialog.openCreate}>Add Division</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {divisions.map((division) => {
            const theme = getDivisionTheme(division);
            const tournamentSlug = division.tournament?.slug;
            const publicPath =
              tournamentSlug && division.slug
                ? getDivisionPublicPath(tournamentSlug, division.slug)
                : null;
            const teamCount = teams.filter((t) => t.division_id === division.id).length;
            const matchCount = matches.filter((m) => m.division_id === division.id).length;

            return (
              <div
                key={division.id}
                className="rounded-[2rem] border-2 border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl shrink-0 border-2 border-gray-100"
                    style={{ backgroundColor: theme.accent }}
                  >
                    <div
                      className="w-full h-full rounded-[10px]"
                      style={{ backgroundColor: theme.primary, opacity: 0.85 }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black uppercase" style={{ color: theme.primary }}>
                      {division.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {division.tournament?.name ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {teamCount} teams · {matchCount} matches
                    </p>
                    {publicPath && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                        {publicPath}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  {publicPath && (
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border hover:bg-muted"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View public
                    </a>
                  )}
                  <Button variant="outline" size="sm" onClick={() => formDialog.openEdit(division)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(division)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </QueryState>

      <DivisionFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        division={formDialog.editing}
      />
    </AdminLayout>
  );
}
