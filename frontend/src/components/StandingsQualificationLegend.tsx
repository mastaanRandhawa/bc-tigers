import {
  divisionHasQualificationZones,
  QUALIFICATION_STYLES,
} from '@/lib/standings-qualification';

interface StandingsQualificationLegendProps {
  divisionSlug?: string;
}

export default function StandingsQualificationLegend({
  divisionSlug,
}: StandingsQualificationLegendProps) {
  if (!divisionHasQualificationZones(divisionSlug)) return null;

  const isPremier = divisionSlug === 'premier';

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span
          className={`h-3.5 w-3.5 rounded-sm ${QUALIFICATION_STYLES.qualified.swatch}`}
          aria-hidden
        />
        {isPremier ? 'Top 8 — advance' : 'Top 2 in pool — advance'}
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className={`h-3.5 w-3.5 rounded-sm ${QUALIFICATION_STYLES.eliminated.swatch}`}
          aria-hidden
        />
        {isPremier ? 'Bottom 2 — out' : 'Bottom 2 in pool — out'}
      </span>
    </div>
  );
}
