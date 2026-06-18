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
      description="Generate knockout brackets per division. Drag teams into slots or click a team, then click a slot."
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-sm">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Division
          </label>
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            teams={teams}
            adminBracketLocked={selectedDivision!.bracket_locked ?? false}
          />
        </QueryState>
      )}
    </AdminLayout>
  );
}
