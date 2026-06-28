import {
  divisionHasQualificationZones,
  qualificationLegendLabels,
  QUALIFICATION_STYLES,
  type QualificationDivisionConfig,
} from '@/lib/standings-qualification';

interface StandingsQualificationLegendProps {
  division?: QualificationDivisionConfig | null;
}

export default function StandingsQualificationLegend({
  division,
}: StandingsQualificationLegendProps) {
  if (!divisionHasQualificationZones(division)) return null;

  const labels = qualificationLegendLabels(division!);
  if (!labels) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span
          className={`h-3.5 w-1 rounded-full ${QUALIFICATION_STYLES.qualified.swatch}`}
          aria-hidden
        />
        {labels.advance}
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className={`h-3.5 w-1 rounded-full ${QUALIFICATION_STYLES.eliminated.swatch}`}
          aria-hidden
        />
        {labels.eliminate}
      </span>
    </div>
  );
}
