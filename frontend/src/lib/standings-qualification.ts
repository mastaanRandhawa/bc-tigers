export type QualificationZone = 'qualified' | 'eliminated';

export interface QualificationRules {
  /** Teams in this zone advance (counted from rank 1). */
  advance: number;
  /** Teams in this zone do not advance (counted from the bottom). */
  eliminate: number;
}

export interface QualificationDivisionConfig {
  qualification_zones_enabled?: boolean;
  qualification_advance?: number;
  qualification_eliminate?: number;
  groups_enabled?: boolean;
}

/** Resolve qualification rules from division admin settings. */
export function qualificationRulesForDivision(
  division?: QualificationDivisionConfig | null,
): QualificationRules | null {
  if (!division?.qualification_zones_enabled) return null;

  const advance = division.qualification_advance ?? 2;
  const eliminate = division.qualification_eliminate ?? 2;
  if (advance <= 0 && eliminate <= 0) return null;

  return {
    advance: Math.max(0, advance),
    eliminate: Math.max(0, eliminate),
  };
}

export function divisionHasQualificationZones(
  division?: QualificationDivisionConfig | null,
): boolean {
  return qualificationRulesForDivision(division) !== null;
}

export function qualificationLegendLabels(
  division: QualificationDivisionConfig,
): { advance: string; eliminate: string } | null {
  const rules = qualificationRulesForDivision(division);
  if (!rules) return null;

  const poolScope = division.groups_enabled ? ' in pool' : '';
  return {
    advance: `Top ${rules.advance}${poolScope} — advance`,
    eliminate: `Bottom ${rules.eliminate}${poolScope} — out`,
  };
}

export function getQualificationZone(
  rank: number,
  totalTeams: number,
  rules: QualificationRules,
): QualificationZone | null {
  if (totalTeams <= 0 || rank < 1) return null;

  const qualified = rank <= rules.advance;
  const eliminated = rank > totalTeams - rules.eliminate;

  if (qualified) return 'qualified';
  if (eliminated) return 'eliminated';
  return null;
}

/** Shared qualification colors — keep row + legend swatches in sync. */
export const QUALIFICATION_STYLES = {
  qualified: {
    row:
      'bg-emerald-50 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/25',
    swatch:
      'border border-emerald-200/90 bg-emerald-100 dark:border-emerald-800/80 dark:bg-emerald-950/55',
  },
  eliminated: {
    row:
      'bg-rose-50 hover:bg-rose-100/60 dark:bg-rose-950/25 dark:hover:bg-rose-900/20',
    swatch:
      'border border-rose-200/90 bg-rose-100 dark:border-rose-900/80 dark:bg-rose-950/50',
  },
} as const;

export function qualificationRowClass(zone: QualificationZone | null): string {
  if (zone === 'qualified') return QUALIFICATION_STYLES.qualified.row;
  if (zone === 'eliminated') return QUALIFICATION_STYLES.eliminated.row;
  return '';
}
