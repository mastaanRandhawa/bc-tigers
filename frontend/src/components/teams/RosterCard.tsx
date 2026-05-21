import { groupRosterByPosition, type RosterPlayer } from '@/lib/roster-utils';
import RosterSection from '@/components/teams/RosterSection';
import { cn } from '@/lib/utils';

export type { RosterPlayer };

export interface RosterCardProps {
  title: string;
  teamName: string;
  players: RosterPlayer[];
  gradientFrom: string;
  gradientTo: string;
  accentColor?: string;
  className?: string;
}

export default function RosterCard({
  title,
  teamName,
  players,
  gradientFrom,
  gradientTo,
  accentColor = '#ffffff',
  className,
}: RosterCardProps) {
  const groups = groupRosterByPosition(players);

  return (
    <article
      className={cn(
        'relative overflow-hidden border-2 border-foreground shadow-hard-md transition-all duration-200 ease-out hover:shadow-hard-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
        className,
      )}
      style={{
        background: `linear-gradient(155deg, ${gradientFrom} 0%, color-mix(in srgb, ${gradientTo} 85%, #121212) 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-2 border-white/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rotate-12 border-2 border-white/10 bg-white/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle at 80% 20%, ${accentColor}44 0%, transparent 45%)`,
        }}
        aria-hidden
      />

      <div className="relative z-10 p-5 sm:p-6 md:p-8">
        <p className="text-overline m-0 text-white/50">{title}</p>
        <h2 className="mt-1 mb-6 font-display text-3xl font-black uppercase tracking-tighter text-white sm:text-4xl md:text-5xl lg:text-6xl">
          {teamName}
        </h2>

        {groups.length === 0 ? (
          <p className="text-sm font-semibold text-white/60">No players on roster.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((g) => (
              <RosterSection
                key={g.position}
                label={g.label}
                players={g.players}
                accentColor={accentColor}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
