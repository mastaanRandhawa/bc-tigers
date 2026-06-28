import { divisionHasQualificationZones } from '@/lib/standings-qualification';

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
          className="h-3.5 w-3.5 rounded-sm border border-green-200 bg-green-100 dark:border-green-900 dark:bg-green-950/40"
          aria-hidden
        />
        {isPremier ? 'Top 8 — advance' : 'Top 2 in pool — advance'}
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="h-3.5 w-3.5 rounded-sm border border-red-200 bg-red-100 dark:border-red-900 dark:bg-red-950/40"
          aria-hidden
        />
        {isPremier ? 'Bottom 2 — out' : 'Bottom 2 in pool — out'}
      </span>
    </div>
  );
}
