import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { teamHaystack, type SearchableTeamOption } from '@/lib/team-search';
import { Search } from 'lucide-react';

export type { SearchableTeamOption };

interface SearchableTeamPickerProps {
  teams: SearchableTeamOption[];
  value: string;
  onChange: (teamId: string) => void;
  id?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

function teamLabel(team: SearchableTeamOption) {
  return `${team.name} · ${team.division.name}`;
}

export default function SearchableTeamPicker({
  teams,
  value,
  onChange,
  id,
  searchPlaceholder = 'Search teams…',
  emptyMessage = 'No teams match your search.',
  className,
}: SearchableTeamPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => teamHaystack(t).includes(q));
  }, [teams, query]);

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-2', className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
          autoComplete="off"
        />
      </div>

      <div
        className="max-h-44 overflow-y-auto rounded-xl border border-border/80 bg-card"
        role="listbox"
        aria-label="Teams"
      >
        {teams.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">No unassigned teams available.</p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          filtered.map((team) => {
            const selected = value === team.id;
            return (
              <button
                key={team.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onChange(team.id)}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 border-b border-border/40 px-3 py-2.5 text-left text-sm last:border-b-0 transition-colors',
                  selected
                    ? 'bg-primary/10 text-foreground'
                    : 'hover:bg-muted/60 text-foreground',
                )}
              >
                <span className="font-medium">{team.name}</span>
                <span className="text-xs text-muted-foreground">{team.division.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export { teamLabel };
