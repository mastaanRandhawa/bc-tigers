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

export function qualificationRowClass(zone: QualificationZone | null): string {
  if (zone === 'qualified') {
    return 'bg-green-100/90 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-950/50';
  }
  if (zone === 'eliminated') {
    return 'bg-red-100/90 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/50';
  }
  return '';
}
