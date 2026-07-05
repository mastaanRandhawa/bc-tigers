import { useMemo } from 'react';
import type { Match } from '@/types';
import {
  DEFAULT_MATCH_LIST_FILTERS,
  hasActiveMatchListFilters,
  uniqueDivisionsFromMatches,
  uniqueTournamentsFromMatches,
  uniqueVenuesFromMatches,
  type MatchListFilters,
} from '@/lib/match-filters';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { id: MatchListFilters['status']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'LIVE', label: 'Live' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'POSTPONED', label: 'Postponed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

interface AdminMatchFiltersProps {
  matches: Match[];
  value: MatchListFilters;
  onChange: (filters: MatchListFilters) => void;
  className?: string;
}

export default function AdminMatchFilters({
  matches,
  value,
  onChange,
  className,
}: AdminMatchFiltersProps) {
  const tournaments = useMemo(() => uniqueTournamentsFromMatches(matches), [matches]);
  const divisions = useMemo(
    () => uniqueDivisionsFromMatches(matches, value.tournamentId),
    [matches, value.tournamentId],
  );
  const venues = useMemo(() => uniqueVenuesFromMatches(matches), [matches]);

  const setTournament = (tournamentId: string) => {
    const nextDivisions = uniqueDivisionsFromMatches(matches, tournamentId);
    const divisionStillValid =
      value.divisionId === 'all' ||
      nextDivisions.some((division) => division.id === value.divisionId);
    onChange({
      ...value,
      tournamentId,
      divisionId: divisionStillValid ? value.divisionId : 'all',
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={value.status === item.id ? 'default' : 'outline'}
            onClick={() => onChange({ ...value, status: item.id })}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={value.tournamentId} onValueChange={setTournament}>
          <SelectTrigger className="h-9 w-full sm:w-[11rem]">
            <SelectValue placeholder="Tournament" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tournaments</SelectItem>
            {tournaments.map((tournament) => (
              <SelectItem key={tournament.id} value={tournament.id}>
                {tournament.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.divisionId}
          onValueChange={(divisionId) => onChange({ ...value, divisionId })}
        >
          <SelectTrigger className="h-9 w-full sm:w-[11rem]">
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All divisions</SelectItem>
            {divisions.map((division) => (
              <SelectItem key={division.id} value={division.id}>
                {division.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.venueId}
          onValueChange={(venueId) => onChange({ ...value, venueId })}
        >
          <SelectTrigger className="h-9 w-full sm:w-[11rem]">
            <SelectValue placeholder="Venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All venues</SelectItem>
            {venues.map((venue) => (
              <SelectItem key={venue.id} value={venue.id}>
                {venue.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveMatchListFilters(value) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 px-3 text-muted-foreground"
            onClick={() => onChange(DEFAULT_MATCH_LIST_FILTERS)}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
