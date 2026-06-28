export type QualificationZone = 'qualified' | 'eliminated';

export interface QualificationRules {
  /** Teams in this zone advance (counted from rank 1). */
  advance: number;
  /** Teams in this zone do not advance (counted from the bottom). */
  eliminate: number;
}

const POOL_DIVISION_SLUGS = new Set(['div-1-gold', 'div-2-silver', 'div-3-bronze']);

const POOL_RULES: QualificationRules = { advance: 2, eliminate: 2 };

/** Premier: top 8 advance, bottom 2 out. Gold/Silver/Bronze: top/bottom 2 per pool. */
export function qualificationRulesForDivision(slug?: string): QualificationRules | null {
  if (!slug) return null;
  if (slug === 'premier') return { advance: 8, eliminate: 2 };
  if (POOL_DIVISION_SLUGS.has(slug)) return POOL_RULES;
  return null;
}

export function divisionHasQualificationZones(slug?: string): boolean {
  return qualificationRulesForDivision(slug) !== null;
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
