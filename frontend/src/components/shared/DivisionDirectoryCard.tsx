import { getDivisionBasePath } from '@/lib/division-routes';
import { getDivisionTheme } from '@/lib/division-theme';
import DirectoryCard from '@/components/shared/DirectoryCard';
import type { Division } from '@/types';

interface DivisionDirectoryCardProps {
  division: Division;
  /**
   * card — standalone rounded card with border + shadow (default, used in listings)
   * row  — borderless list row; relies on parent container for separation
   */
  variant?: 'card' | 'row';
  description?: string;
}

export default function DivisionDirectoryCard({
  division,
  variant = 'card',
  description,
}: DivisionDirectoryCardProps) {
  const href = getDivisionBasePath(division);
  if (!href) return null;

  const theme = getDivisionTheme(division);

  const media = (
    <div
      className={`flex items-center justify-center text-xs font-black uppercase tracking-wider ${variant === 'row' ? 'h-9 w-9 rounded-lg' : 'h-10 w-10 rounded-lg'}`}
      style={{
        backgroundColor: theme.accent,
        color: theme.primary,
        border: `1.5px solid color-mix(in srgb, ${theme.primary} 22%, transparent)`,
      }}
      aria-hidden
    >
      {division.name.slice(0, 2)}
    </div>
  );

  const badges = (
    <>
      {division.age_group && (
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: theme.accent, color: theme.accentForeground }}
        >
          {division.age_group}
        </span>
      )}
      <span
        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
        style={{ backgroundColor: theme.accent, color: theme.accentForeground }}
      >
        {division.format}
      </span>
    </>
  );

  return (
    <DirectoryCard
      href={href}
      media={media}
      title={division.name}
      meta={variant !== 'row' ? (description ?? division.tournament?.name) : undefined}
      badges={badges}
      variant={variant}
      accentColor={theme.primary}
    />
  );
}
