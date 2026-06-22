import { useMemo, useState } from 'react';
import { Search, Shuffle, X } from 'lucide-react';
import type { Team } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { shuffleTeamIds, configureTeamDrag } from '@/lib/bracket-utils';

interface BracketTeamPoolProps {
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

export function BracketTeamPool({
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
}: BracketTeamPoolProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'unassigned'>('unassigned');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...teams];
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.city?.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'unassigned') {
        const aAssigned = assignedTeamIds.has(a.id) ? 1 : 0;
        const bAssigned = assignedTeamIds.has(b.id) ? 1 : 0;
        if (aAssigned !== bAssigned) return aAssigned - bAssigned;
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [teams, search, sortBy, assignedTeamIds]);

  const unassignedCount = teams.filter((t) => !assignedTeamIds.has(t.id)).length;
  const multiCount = selectedTeamIds.size;

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Team pool
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {unassignedCount} unassigned · {teams.length} total
            {multiCount > 0 && ` · ${multiCount} selected`}
          </p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'unassigned')}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
          aria-label="Sort teams"
        >
          <option value="unassigned">Unassigned first</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {multiCount > 0 && !locked && (
        <div className="mb-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={busy}
            onClick={() => onRandomizeSelected(shuffleTeamIds([...selectedTeamIds]))}
          >
            <Shuffle className="h-3 w-3 mr-1" />
            Randomize selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={busy}
            onClick={() => onRemoveSelected([...selectedTeamIds])}
          >
            <X className="h-3 w-3 mr-1" />
            Remove from bracket
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onClearSelection}>
            Clear selection
          </Button>
        </div>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams…"
          className="h-8 pl-8 text-xs"
        />
      </div>

      <p className="text-[10px] text-muted-foreground mb-2">
        Ctrl+click to multi-select · drag or click team then click slot
      </p>

      <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
        {filtered.map((team) => {
          const assigned = assignedTeamIds.has(team.id);
          const isSingleSelected = selectedTeamId === team.id;
          const isMultiSelected = selectedTeamIds.has(team.id);
          const isDragging = dragTeamId === team.id;

          return (
            <div
              key={team.id}
              role="button"
              tabIndex={locked ? -1 : 0}
              draggable={!locked}
              onDragStart={(e) => {
                e.stopPropagation();
                configureTeamDrag(e.nativeEvent, team.id);
                onDragStart(team, e);
              }}
              onDragEnd={onDragEnd}
              onClick={(e) => onSelectTeam(team, e.ctrlKey || e.metaKey)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTeam(team, e.ctrlKey || e.metaKey);
                }
              }}
              className={`flex cursor-grab items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-left text-xs shadow-sm transition-all active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-60 ${
                locked ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isSingleSelected || isMultiSelected
                  ? 'border-primary ring-2 ring-primary/30 scale-[1.02]'
                  : isDragging
                  ? 'opacity-50 border-primary/50'
                  : assigned
                  ? 'border-border/60 opacity-70'
                  : 'border-border hover:border-primary/40'
              }`}
              style={{ borderLeftColor: team.primary_color ?? undefined, borderLeftWidth: 3 }}
            >
              {team.logo ? (
                <img src={team.logo} alt="" className="h-5 w-5 rounded object-cover shrink-0" />
              ) : null}
              <span className="min-w-0">
                <span className="block font-medium text-foreground truncate max-w-[140px]">{team.name}</span>
                {team.city && (
                  <span className="block text-[10px] text-muted-foreground truncate">{team.city}</span>
                )}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">No teams match your search.</p>
        )}
      </div>
    </div>
  );
}
