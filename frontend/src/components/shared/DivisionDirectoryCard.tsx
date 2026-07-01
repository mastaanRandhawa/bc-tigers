import { getDivisionBasePath } from '@/lib/division-routes';
import { getDivisionTheme, themeChipStyle } from '@/lib/division-theme';
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
  /**
   * When set, the card links to this division's teams page pre-filtered by
   * the query (?q=…) instead of the division overview — used to search teams
   * across divisions from the tournament page.
   */
  teamQuery?: string;
}

export default function DivisionDirectoryCard({
  division,
  variant = 'card',
  description,
  teamQuery,
}: DivisionDirectoryCardProps) {
  const basePath = getDivisionBasePath(division);
  if (!basePath) return null;

  const trimmedTeamQuery = teamQuery?.trim();
  const href = trimmedTeamQuery
    ? `${basePath}/teams?q=${encodeURIComponent(trimmedTeamQuery)}`
    : basePath;

  const theme = getDivisionTheme(division);

  const chipStyle = themeChipStyle(theme);

  const media = (
    <div
      className={`theme-chip flex items-center justify-center text-xs font-black uppercase tracking-wider ${variant === 'row' ? 'h-9 w-9 rounded-lg' : 'h-10 w-10 rounded-lg'}`}
      style={chipStyle}
      aria-hidden
    >
      {division.name.slice(0, 2)}
    </div>
  );

  const badges = (
    <>
      {division.age_group && (
        <span
          className="theme-chip rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={chipStyle}
        >
          {division.age_group}
        </span>
      )}
      <span
        className="theme-chip rounded px-1.5 py-0.5 text-[10px] font-medium"
        style={chipStyle}
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
