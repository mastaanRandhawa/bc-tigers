import { Shield } from 'lucide-react';
import type { Team } from '@/types';
import { hexToRgba } from '@/lib/color';

interface TeamHeroProps {
  team: Team;
  /** Division or tournament context label shown above the team name */
  contextLabel?: string;
}

export default function TeamHero({ team, contextLabel }: TeamHeroProps) {
  const color = team.primary_color ?? '#F48735';
  const isHex = color.startsWith('#') && color.length >= 7;
  const glow = isHex ? hexToRgba(color, 0.18) : 'transparent';

  return (
    <div
      className="relative mb-5 overflow-hidden rounded-2xl border border-border/60 py-10 text-center"
      style={{
        background: `radial-gradient(ellipse at 50% -10%, ${glow} 0%, transparent 60%), hsl(var(--card))`,
      }}
    >
      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-brand-grid opacity-30" aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-0">
        {/* Crest */}
        <div
          className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full drop-shadow-xl"
          style={{
            background: isHex ? hexToRgba(color, 0.15) : 'var(--color-secondary)',
            border: `2px solid ${isHex ? hexToRgba(color, 0.50) : 'var(--color-border)'}`,
            boxShadow: `0 8px 32px ${isHex ? hexToRgba(color, 0.20) : 'transparent'}`,
          }}
        >
          {team.logo ? (
            <img src={team.logo} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <Shield className="h-9 w-9" style={{ color }} aria-hidden />
          )}
        </div>

        {/* Context / division label */}
        {contextLabel && (
          <p
            className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color }}
          >
            {contextLabel}
          </p>
        )}
        {team.city && !contextLabel && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {team.city}
          </p>
        )}

        {/* Team name — large condensed poster style */}
        <h1
          className="font-display text-4xl font-black uppercase leading-none tracking-tight text-foreground sm:text-5xl md:text-6xl"
        >
          {team.name}
        </h1>

        {/* Accent rule */}
        <span
          className="mt-4 block h-0.5 w-16 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      </div>
    </div>
  );
}
