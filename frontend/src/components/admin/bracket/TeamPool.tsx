import { useMemo, useState } from 'react';
import { Shuffle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shuffleTeamIds } from '@/lib/bracket-utils';
import type { Team } from '@/types';
import { SearchToolbar } from './SearchToolbar';
import { TeamCard } from './TeamCard';
import type { TeamFilter, TeamSort } from './types';

interface TeamPoolProps {
  teams: Team[];
  assignedTeamIds: Set<string>;
  selectedTeamId: string | null;
  selectedTeamIds: Set<string>;
  dragTeamId: string | null;
  locked?: boolean;
  busy?: boolean;
  onSelectTeam: (team: Team, multi: boolean) => void;
  onDragStart: (team: Team, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRandomizeSelected: (teamIds: string[]) => void;
  onRemoveSelected: (teamIds: string[]) => void;
  onClearSelection: () => void;
}

export function TeamPool({
  teams,
  assignedTeamIds,
  selectedTeamId,
  selectedTeamIds,
  dragTeamId,
  locked,
  busy,
  onSelectTeam,
  onDragStart,
  onDragEnd,
  onRandomizeSelected,
  onRemoveSelected,
  onClearSelection,
}: TeamPoolProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<TeamSort>('unassigned');
  const [filter, setFilter] = useState<TeamFilter>('all');

  const unassignedCount = teams.filter((t) => !assignedTeamIds.has(t.id)).length;
  const multiCount = selectedTeamIds.size;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...teams];

    if (filter === 'assigned') {
      list = list.filter((t) => assignedTeamIds.has(t.id));
    } else if (filter === 'unassigned') {
      list = list.filter((t) => !assignedTeamIds.has(t.id));
    }

    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.city?.toLowerCase().includes(q) ||
          t.division?.name?.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'unassigned') {
        const aAssigned = assignedTeamIds.has(a.id) ? 1 : 0;
        const bAssigned = assignedTeamIds.has(b.id) ? 1 : 0;
        if (aAssigned !== bAssigned) return aAssigned - bAssigned;
      }
      if (sortBy === 'city') {
        return (a.city ?? '').localeCompare(b.city ?? '');
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [teams, search, sortBy, filter, assignedTeamIds]);

  return (
    <section className="rounded-lg border border-border/80 bg-[hsl(var(--surface-muted))] p-4 shadow-[var(--shadow-sm)] sm:p-6">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Team pool</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {unassignedCount} unassigned · {teams.length} total
            {multiCount > 0 ? ` · ${multiCount} selected` : ''}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Ctrl+click to multi-select · drag or click team then click slot
        </p>
      </div>

      <SearchToolbar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filter={filter}
        onFilterChange={setFilter}
        totalCount={teams.length}
        unassignedCount={unassignedCount}
      />

      {multiCount > 0 && !locked && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => onRandomizeSelected(shuffleTeamIds([...selectedTeamIds]))}
          >
            <Shuffle className="h-3.5 w-3.5" />
            Randomize selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => onRemoveSelected([...selectedTeamIds])}
          >
            <X className="h-3.5 w-3.5" />
            Remove from bracket
          </Button>
          <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={onClearSelection}>
            Clear selection
          </Button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 max-h-[320px] overflow-y-auto pr-1">
        {filtered.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            assigned={assignedTeamIds.has(team.id)}
            selected={selectedTeamId === team.id || selectedTeamIds.has(team.id)}
            dragging={dragTeamId === team.id}
            locked={locked}
            onSelect={onSelectTeam}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No teams match your filters.</p>
        )}
      </div>
    </section>
  );
}
