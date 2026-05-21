import type { Player } from '@/types';

export type RosterPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'attacker';

export type RosterPlayer = {
  id: string;
  number: number;
  name: string;
  position: RosterPosition;
};

const POSITION_ORDER: RosterPosition[] = [
  'goalkeeper',
  'defender',
  'midfielder',
  'attacker',
];

const POSITION_LABELS: Record<RosterPosition, string> = {
  goalkeeper: 'Goalkeepers',
  defender: 'Defenders',
  midfielder: 'Midfielders',
  attacker: 'Attackers',
};

const POSITION_MAP: Record<string, RosterPosition> = {
  goalkeeper: 'goalkeeper',
  gk: 'goalkeeper',
  goalie: 'goalkeeper',
  defender: 'defender',
  def: 'defender',
  defence: 'defender',
  defense: 'defender',
  midfielder: 'midfielder',
  mid: 'midfielder',
  attacker: 'attacker',
  forward: 'attacker',
  fwd: 'attacker',
  striker: 'attacker',
};

export function mapPreferredPosition(pos?: string | null): RosterPosition {
  if (!pos) return 'midfielder';
  const key = pos.toLowerCase().trim();
  return POSITION_MAP[key] ?? 'midfielder';
}

export function playersToRoster(players: Player[]): RosterPlayer[] {
  return players
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      number: p.jersey_number ?? 0,
      name: `${p.first_name} ${p.last_name}`.trim(),
      position: mapPreferredPosition(p.preferred_position),
    }))
    .sort((a, b) => a.number - b.number || a.name.localeCompare(b.name));
}

export function groupRosterByPosition(players: RosterPlayer[]) {
  return POSITION_ORDER.map((position) => ({
    position,
    label: POSITION_LABELS[position],
    players: players.filter((p) => p.position === position),
  })).filter((g) => g.players.length > 0);
}
