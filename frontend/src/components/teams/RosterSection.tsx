import RosterPlayerRow from '@/components/teams/RosterPlayerRow';
import type { RosterPlayer } from '@/lib/roster-utils';

interface RosterSectionProps {
  label: string;
  players: RosterPlayer[];
  accentColor?: string;
}

export default function RosterSection({ label, players, accentColor }: RosterSectionProps) {
  const colCount = players.length > 8 ? 2 : 1;

  return (
    <div className="min-w-0">
      <h4 className="text-overline mb-2 border-b-2 border-white/20 pb-1.5 text-white/55">
        {label}
      </h4>
      <div
        className="grid gap-x-4 gap-y-0"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {players.map((p) => (
          <RosterPlayerRow
            key={p.id}
            number={p.number}
            name={p.name}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}
