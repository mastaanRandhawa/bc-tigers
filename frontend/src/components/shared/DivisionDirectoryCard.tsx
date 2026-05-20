import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getDivisionBasePath } from '@/lib/division-routes';
import { getDivisionTheme } from '@/lib/division-theme';
import type { Division } from '@/types';

interface DivisionDirectoryCardProps {
  division: Division;
  description?: string;
}

export default function DivisionDirectoryCard({
  division,
  description,
}: DivisionDirectoryCardProps) {
  const href = getDivisionBasePath(division);
  if (!href) return null;

  const theme = getDivisionTheme(division);

  return (
    <Link
      to={href}
      className="group flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-border/60 transition-all duration-200 hover:shadow-md hover:ring-zinc-300"
    >
      {/* Division color swatch */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-black uppercase tracking-wider"
        style={{
          backgroundColor: theme.accent,
          color: theme.primary,
          border: `1.5px solid color-mix(in srgb, ${theme.primary} 22%, transparent)`,
        }}
        aria-hidden
      >
        {division.name.slice(0, 2)}
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className="truncate text-sm font-semibold text-foreground transition-colors"
          style={{ ['--hover-color' as string]: theme.primary }}
        >
          <span className="group-hover:text-[var(--hover-color,theme(colors.primary))]">
            {division.name}
          </span>
        </h3>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {description ?? division.tournament?.name}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {division.age_group && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: theme.accent,
                color: theme.accentForeground,
              }}
            >
              {division.age_group}
            </span>
          )}
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: theme.accent,
              color: theme.accentForeground,
            }}
          >
            {division.format}
          </span>
        </div>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-zinc-300 transition-all duration-200 group-hover:translate-x-0.5"
        style={{ color: undefined }}
        aria-hidden
      />
    </Link>
  );
}
