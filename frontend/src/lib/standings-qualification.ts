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
      'shadow-[inset_3px_0_0_0_rgb(5_150_105)] hover:bg-emerald-500/[0.04] dark:shadow-[inset_3px_0_0_0_rgb(52_211_153)] dark:hover:bg-emerald-400/[0.06]',
    swatch: 'bg-emerald-600 dark:bg-emerald-400',
  },
  eliminated: {
    row:
      'shadow-[inset_3px_0_0_0_rgb(220_38_38)] hover:bg-red-500/[0.04] dark:shadow-[inset_3px_0_0_0_rgb(248_113_113)] dark:hover:bg-red-400/[0.06]',
    swatch: 'bg-red-600 dark:bg-red-400',
  },
} as const;

export function qualificationRowClass(zone: QualificationZone | null): string {
  if (zone === 'qualified') return QUALIFICATION_STYLES.qualified.row;
  if (zone === 'eliminated') return QUALIFICATION_STYLES.eliminated.row;
  return '';
}
