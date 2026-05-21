import { Users } from 'lucide-react';
import MetaChip from '@/components/design-system/MetaChip';
import GeometricAccent from '@/components/design-system/GeometricAccent';
import type { Division } from '@/types';
import type { DivisionTheme } from '@/lib/division-theme';

interface DivisionHeroProps {
  division: Division;
  theme: DivisionTheme;
}

export default function DivisionHero({ division, theme }: DivisionHeroProps) {
  const teamCount = division.teams?.length ?? 0;
  const matchCount = division._count?.matches;

  return (
    <div
      className="relative overflow-hidden border-b-2 border-foreground"
      style={{
        background: `linear-gradient(145deg, color-mix(in srgb, ${theme.primary} 85%, #121212) 0%, color-mix(in srgb, ${theme.primary} 40%, #121212) 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-hero-mesh opacity-40" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-20" aria-hidden />
      <GeometricAccent shape="circle" position="top-right" size="md" color="muted" />

      <div className="page-container relative z-10 py-5 sm:py-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-white text-sm font-black uppercase tracking-wider shadow-hard-sm sm:h-16 sm:w-16"
            style={{
              backgroundColor: theme.accent,
              color: theme.primary,
            }}
            aria-hidden
          >
            {division.name.slice(0, 2)}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="division-hero-headline truncate text-2xl text-white sm:text-3xl md:text-4xl">
              {division.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {division.age_group && (
                <span className="border-2 border-white/40 bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                  {division.age_group}
                </span>
              )}
              <span className="border-2 border-white/40 bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                {division.gender}
              </span>
              <span className="border-2 border-white/40 bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                {division.format}
              </span>
              {teamCount > 0 && (
                <MetaChip icon={Users} value={`${teamCount} teams`} variant="dark" />
              )}
              {matchCount != null && matchCount > 0 && (
                <MetaChip value={`${matchCount} matches`} variant="dark" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
