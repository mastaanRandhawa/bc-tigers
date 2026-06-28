import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { groupTeamsByDivision, teamHaystack } from '@/lib/team-search';
import type { SearchableTeamOption } from '@/lib/team-search';
import { Search } from 'lucide-react';

interface SearchableTeamMultiSelectProps {
  teams: SearchableTeamOption[];
  selectedIds: string[];
  onToggle: (teamId: string) => void;
  searchId?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export default function SearchableTeamMultiSelect({
  teams,
  selectedIds,
  onToggle,
  searchId,
  searchPlaceholder = 'Search by team, division, or tournament…',
  emptyMessage = 'No teams match your search.',
  loading = false,
  className,
}: SearchableTeamMultiSelectProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => teamHaystack(t).includes(q));
  }, [teams, query]);

  const groups = useMemo(() => groupTeamsByDivision(filtered), [filtered]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading teams…</p>;
  }

  if (teams.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No unassigned teams are available right now.</p>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
          autoComplete="off"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-xl border border-border/80 bg-card p-3 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{emptyMessage}</p>
        ) : (
          groups.map((g) => (
            <div key={g.id}>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">{g.label}</p>
              <ul className="space-y-1.5">
                {g.teams.map((t) => (
                  <li key={t.id}>
                    <label className="flex items-center gap-2 text-sm cursor-pointer rounded-md px-1 py-0.5 hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(t.id)}
                        onChange={() => onToggle(t.id)}
                        className="rounded border-border"
                      />
                      {t.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} {selectedIds.length === 1 ? 'team' : 'teams'} selected
        </p>
      )}
    </div>
  );
}
