import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { BracketCanvas } from '@/components/admin/BracketCanvas';
import QueryState from '@/components/shared/QueryState';
import { useDivisions } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { Link } from 'react-router-dom';
import { GitBranch, ArrowRight } from 'lucide-react';

export default function AdminBrackets() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();
  const [divisionId, setDivisionId] = useState('');

  const selectedDivision = divisions.find((d) => d.id === divisionId);
  const { data: teams = [] } = useTeams(
    divisionId ? { divisionId } : undefined,
  );

  return (
    <AdminLayout
      title="Brackets"
      description="Manage knockout tournaments with drag-and-drop seeding and live bracket progression."
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-md space-y-2">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Division
          </label>
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            className="h-11 w-full rounded-xl border border-border/80 bg-card px-3 text-sm text-foreground shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Select division"
          >
            <option value="">Select a division…</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.tournament?.name ? ` · ${d.tournament.name}` : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedDivision?.tournament?.id && (
          <Link
            to={`/admin/tournaments/${selectedDivision.tournament.id}/divisions/${selectedDivision.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open division workspace
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>

      {!divisionId ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <GitBranch className="h-10 w-10 text-muted-foreground/40" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Select a division to generate and manage its knockout bracket.
          </p>
        </div>
      ) : (
        <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
          <BracketCanvas
            divisionId={selectedDivision!.id}
            divisionSlug={selectedDivision!.slug}
            divisionName={selectedDivision!.name}
            tournamentName={selectedDivision!.tournament?.name}
            teams={teams}
            adminBracketLocked={selectedDivision!.bracket_locked ?? false}
            adminBracketFinalized={selectedDivision!.bracket_finalized ?? false}
          />
        </QueryState>
      )}
    </AdminLayout>
  );
}
