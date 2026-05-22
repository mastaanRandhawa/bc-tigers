import { Shield } from 'lucide-react';
import type { Team } from '@/types';
import { getContrastText, hexToRgba } from '@/lib/color';

interface TeamHeroProps {
  team: Team;
  /** Division or tournament context label shown above the team name */
  contextLabel?: string;
}

export default function TeamHero({ team, contextLabel }: TeamHeroProps) {
  const color = team.primary_color ?? '#F48735';
  const isHex = color.startsWith('#') && color.length >= 7;
  const textColor = isHex ? getContrastText(color) : '#ffffff';
  const mutedText = hexToRgba(textColor, 0.75);
  const crestRing = hexToRgba(textColor, 0.35);
  const crestBg = hexToRgba(textColor, 0.12);

  return (
    <div
      className="relative mb-5 overflow-hidden rounded-xl py-10 text-center sm:py-12"
      style={{ backgroundColor: color }}
    >
      <div className="relative z-10 flex flex-col items-center gap-0">
        <div
          className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full sm:h-24 sm:w-24"
          style={{
            backgroundColor: crestBg,
            border: `2px solid ${crestRing}`,
          }}
        >
          {team.logo ? (
            <img src={team.logo} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <Shield className="h-9 w-9 sm:h-10 sm:w-10" style={{ color: textColor }} aria-hidden />
          )}
        </div>

        {contextLabel && (
          <p
            className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: mutedText }}
          >
            {contextLabel}
          </p>
        )}
        {team.city && !contextLabel && (
          <p
            className="mb-1 text-xs font-semibold uppercase tracking-widest"
            style={{ color: mutedText }}
          >
            {team.city}
          </p>
        )}

        <h1
          className="font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl md:text-6xl"
          style={{ color: textColor }}
        >
          {team.name}
        </h1>

        <span
          className="mt-4 block h-0.5 w-14 rounded-full"
          style={{ backgroundColor: hexToRgba(textColor, 0.45) }}
          aria-hidden
        />
      </div>
    </div>
  );
}
