import { Link } from 'react-router-dom';
import type { Player } from '@/types';
import { divisionTeamPlayerPath } from '@/lib/division-routes';

interface RosterListProps {
  players: (Player | null | undefined)[];
  tournamentSlug: string;
  divisionSlug: string;
  teamSlug: string;
  teamColor?: string;
}

// ── Position grouping ──────────────────────────────────────────────────────────

const GROUP_ORDER = ['Goalkeepers', 'Defenders', 'Midfielders', 'Forwards', 'Other'] as const;
type GroupName = (typeof GROUP_ORDER)[number];

function getPositionGroup(pos?: string): GroupName {
  if (!pos) return 'Other';
  const p = pos.toUpperCase();
  if (['GK', 'GOALKEEPER'].includes(p)) return 'Goalkeepers';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'DC', 'DEFENDER', 'DEF'].includes(p))
    return 'Defenders';
  if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM', 'MF', 'MIDFIELDER', 'MID'].includes(p))
    return 'Midfielders';
  if (['FW', 'ST', 'CF', 'LW', 'RW', 'SS', 'FORWARD', 'STRIKER', 'ATT'].includes(p))
    return 'Forwards';
  return 'Other';
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function RosterList({
  players,
  tournamentSlug,
  divisionSlug,
  teamSlug,
  teamColor = '#F48735',
}: RosterListProps) {
  const roster = players.filter(Boolean) as Player[];

  if (roster.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No players on roster yet.</p>
    );
  }

  // Build position groups
  const groups = GROUP_ORDER.reduce<Record<GroupName, Player[]>>(
    (acc, g) => { acc[g] = []; return acc; },
    {} as Record<GroupName, Player[]>,
  );
  for (const player of roster) {
    groups[getPositionGroup(player.preferred_position)].push(player);
  }
  const visibleGroups = GROUP_ORDER.filter((g) => groups[g].length > 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      {visibleGroups.map((groupName, idx) => (
        <div key={groupName}>
          {/* Thin divider between groups (not before the first) */}
          {idx > 0 && (
            <div
              className="mx-auto h-px w-1/3"
              style={{ backgroundColor: teamColor, opacity: 0.25 }}
              aria-hidden
            />
          )}

          <div className="px-6 py-6 text-center sm:px-10">
            {/* Position heading */}
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              {groupName}
            </p>

            {/* Player names — centered flowing rows, each is a link */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
              {groups[groupName].map((player) => (
                <Link
                  key={player.id}
                  to={divisionTeamPlayerPath(tournamentSlug, divisionSlug, teamSlug, player.id)}
                  className="group inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
                >
                  {/* Optional jersey number */}
                  {player.jersey_number != null && (
                    <span
                      className="text-[11px] font-mono font-bold tabular-nums"
                      style={{ color: teamColor, opacity: 0.7 }}
                    >
                      {player.jersey_number}
                    </span>
                  )}
                  <span className="text-sm font-bold uppercase tracking-wide text-foreground">
                    {player.first_name} {player.last_name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
