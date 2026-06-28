import type { Division, Standing } from '@/types';
import StandingsTable from './StandingsTable';

interface GroupedStandingsTableProps {
  standings: Standing[];
  division?: Division;
  compact?: boolean;
  searchable?: boolean;
  showFairPlay?: boolean;
}

interface GroupBucket {
  id: string;
  name: string;
  order: number;
  rows: Standing[];
}

/**
 * Renders a single league table, or — when the division has groups enabled and
 * the standings carry group assignments — one ranked table per group (pool).
 */
export default function GroupedStandingsTable({
  standings,
  division,
  compact = false,
  searchable = true,
  showFairPlay = false,
}: GroupedStandingsTableProps) {
  const useGroups =
    (division?.groups_enabled ?? false) &&
    standings.some((s) => Boolean(s.group_id));

  if (!useGroups) {
    return (
      <StandingsTable
        standings={standings}
        division={division}
        compact={compact}
        searchable={searchable}
        showFairPlay={showFairPlay}
      />
    );
  }

  const buckets = new Map<string, GroupBucket>();
  const ungrouped: Standing[] = [];
  for (const s of standings) {
    if (s.group_id && s.group) {
      const bucket =
        buckets.get(s.group_id) ??
        ({ id: s.group_id, name: s.group.name, order: s.group.order, rows: [] } as GroupBucket);
      bucket.rows.push(s);
      buckets.set(s.group_id, bucket);
    } else {
      ungrouped.push(s);
    }
  }

  const groups = [...buckets.values()].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id} className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {group.name}
          </h3>
          <StandingsTable
            standings={group.rows}
            division={division}
            compact={compact}
            searchable={false}
            showFairPlay={showFairPlay}
          />
        </div>
      ))}
      {ungrouped.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Unassigned
          </h3>
          <StandingsTable
            standings={ungrouped}
            division={division}
            compact={compact}
            searchable={false}
            showFairPlay={showFairPlay}
          />
        </div>
      )}
    </div>
  );
}
