import type { Division } from '@/types';
import type { DivisionTheme } from '@/lib/division-theme';

interface DivisionHeroProps {
  division: Division;
  theme: DivisionTheme;
}

export default function DivisionHero({ division, theme }: DivisionHeroProps) {
  return (
    <div className="page-container relative z-10 pt-3 pb-4">
      {/* Division identity row */}
      <div className="flex items-center gap-3">
        {/* Division color swatch / icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-12 sm:w-12"
          style={{
            backgroundColor: theme.accent,
            border: `1.5px solid color-mix(in srgb, ${theme.primary} 25%, transparent)`,
          }}
          aria-hidden
        >
          {/* Soccer-ball inspired dot pattern using division primary */}
          <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="none">
            <circle cx="12" cy="12" r="9" stroke={theme.primary} strokeWidth="1.5" />
            <circle cx="12" cy="12" r="2.5" fill={theme.primary} />
            <path
              d="M12 3 L12 6.5M12 17.5 L12 21M3 12 L6.5 12M17.5 12 L21 12"
              stroke={theme.primary}
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.4"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h1
            className="division-hero-headline truncate text-2xl sm:text-3xl md:text-4xl"
            style={{ color: theme.primary }}
          >
            {division.name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {division.age_group && (
              <span className="division-badge">{division.age_group}</span>
            )}
            <span className="division-badge">{division.gender}</span>
            <span className="division-badge">{division.format}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
