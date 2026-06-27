import type { MatchStatus } from '@prisma/client';

export type CupDay = 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface RawMatchLine {
  num: string;
  division: string;
  home: string;
  away: string;
  day: CupDay;
  time: string;
  field: string;
  matchType?: string;
}

export interface ParsedMatch {
  num: string;
  home: string;
  away: string;
  day: number;
  hour: number;
  minute: number;
  field: string;
  matchType: string;
  status: MatchStatus;
}

const DAY_MAP: Record<CupDay, number> = {
  FRIDAY: 3,
  SATURDAY: 4,
  SUNDAY: 5,
};

/** Normalize PDF team labels for consistent seeding. */
export function normalizeTeamName(raw: string): string {
  let name = raw
    .replace(/\s+/g, ' ')
    .replace(/\t/g, ' ')
    .trim();

  // Fix missing "VS" between teams (e.g. "BCT LIONS 2019 RISE ACADEMY")
  if (!/\bVS\b/i.test(name) && /\d{4}\s+[A-Z]/i.test(name)) {
    name = name.replace(/(\d{4})\s+([A-Z])/i, '$1 VS $2');
  }

  // Bracket / pool placeholders
  name = name
    .replace(/^WINNER OF MATCH\s+/i, 'Winner of Match ')
    .replace(/^LOSER OF MATCH\s+/i, 'Loser of Match ')
    .replace(/^WINNER OF\s+/i, 'Winner of ')
    .replace(/^LOSER OF\s+/i, 'Loser of ')
    .replace(/^POOL\s+([A-D])\s+1ST$/i, 'Pool $1 1st')
    .replace(/^POOL\s+([A-D])\s+2ND$/i, 'Pool $1 2nd')
    .replace(/^POOL\s+([A-D])A\s+2ND$/i, 'Pool A 2nd')
    .replace(/^POOL\s+([A-D])B\s+2ND$/i, 'Pool B 2nd')
    .replace(/^POOL\s+([A-D])C\s+2ND$/i, 'Pool C 2nd')
    .replace(/^POOL\s+([A-D])D\s+2ND$/i, 'Pool D 2nd')
    .replace(/^POOL\s+([A-D])\s+IST$/i, 'Pool $1 1st')
    .replace(/^QUARTER FINALS\s+(\d+)$/i, 'Quarter Finals $1')
    .replace(/^1ST$/i, '1st Place')
    .replace(/^2ND$/i, '2nd Place')
    .replace(/^WIINER OF MATCH/i, 'Winner of Match');

  // Field / venue typos in team strings
  name = name.replace(/\bNAP\d\b/gi, '').trim();

  return name
    .split(' ')
    .map((word, i) => {
      if (word.toUpperCase() === 'VS') return 'vs';
      if (word.toUpperCase() === 'FC' && i > 0) return 'FC';
      if (/^\(.*\)$/.test(word)) return word;
      if (/^\d{4}$/.test(word)) return word;
      if (word.includes('/')) return word;
      if (word.length <= 3 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\bBc\b/g, 'BC')
    .replace(/\bBct\b/g, 'BCT')
    .replace(/\bAusc\b/g, 'AUSC')
    .replace(/\bSfc\b/g, 'SFC')
    .replace(/\bGvu\b/g, 'GVU')
    .replace(/\bVs\b/g, 'vs')
    .replace(/\bFc\b/g, 'FC')
    .replace(/\bO\/40\b/gi, 'Over 40')
    .replace(/\bO\/45\b/gi, 'Over 45')
    .replace(/\bO40\b/gi, 'Over 40')
    .replace(/\bN\.westminster\b/gi, 'N.Westminster')
    .replace(/\bRoss St\./gi, 'Ross St.')
    .replace(/\bPanthers2014\b/gi, 'Panthers 2014')
    .replace(/\bUnited14\b/gi, 'United 14')
    .replace(/\bSpeed13\b/gi, 'Speed 13')
    .replace(/\bOfmatch\b/gi, 'of Match')
    .replace(/\bOf Match\s+(\d+)/gi, 'of Match $1')
    .replace(/\bWinner Of Match (\d+)/g, 'Winner of Match $1')
    .replace(/\bLoser Of Match (\d+)/g, 'Loser of Match $1')
    .replace(/\bWinner Of Pool\b/gi, 'Winner of Pool')
    .replace(/\bPool A 1st\b/g, 'Pool A 1st')
    .replace(/\bPool B 1st\b/g, 'Pool B 1st')
    .replace(/\bPool C 1st\b/g, 'Pool C 1st')
    .replace(/\bPool D 1st\b/g, 'Pool D 1st')
    .replace(/\bPool A 2nd\b/g, 'Pool A 2nd')
    .replace(/\bPool B 2nd\b/g, 'Pool B 2nd')
    .replace(/\bPool C 2nd\b/g, 'Pool C 2nd')
    .replace(/\bPool D 2nd\b/g, 'Pool D 2nd');
}

export function parseTime(raw: string): { hour: number; minute: number } {
  const cleaned = raw.replace(/;/g, ':').replace(/\s+/g, '').toUpperCase();
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)$/);
  if (!match) {
    throw new Error(`Invalid time: ${raw}`);
  }
  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

export function normalizeField(raw: string): string {
  const field = raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/BEAR CREK/gi, 'Bear Creek')
    .replace(/HJORTH/gi, 'Hjorth')
    .replace(/HORTH/gi, 'Hjorth')
    .replace(/STRAWBERRY HILL/gi, 'Strawberry Hill')
    .replace(/NAP MINI TURF 1/gi, 'NAP Mini Turf 1')
    .replace(/NAP\s*MINI\s*TURF\s*1/gi, 'NAP Mini Turf 1')
    .replace(/NAP\s*(\d+)\s*([NS]?)\s*([12]?)/gi, (_, num, dir, sub) => {
      const suffix = [dir, sub].filter(Boolean).join(' ');
      return suffix ? `NAP ${num} ${suffix}` : `NAP ${num}`;
    })
    .replace(/NAP\s*(\d+)A/gi, 'NAP $1A')
    .replace(/NAP\s*(\d+)N(\d)?/gi, (_, n, sub) => (sub ? `NAP ${n} N${sub}` : `NAP ${n} N`))
    .replace(/NAP\s*(\d+)S/gi, 'NAP $1 S')
    .replace(/NAP\s*(\d+)N\b/gi, 'NAP $1 N')
    .replace(/NAP(\d+)/gi, 'NAP $1')
    .replace(/NAP\s+(\d)([ANS])(\d)?/gi, (_, d, dir, sub) =>
      sub ? `NAP ${d} ${dir}${sub}` : `NAP ${d} ${dir}`,
    );

  return field;
}

export function parseMatchLine(line: RawMatchLine): ParsedMatch {
  const home = normalizeTeamName(line.home);
  const away = normalizeTeamName(line.away);
  if (!home || !away) {
    throw new Error(`Match ${line.num}: missing home or away team`);
  }
  if (home.toLowerCase() === away.toLowerCase()) {
    throw new Error(`Match ${line.num}: home and away are the same (${home})`);
  }

  const { hour, minute } = parseTime(line.time);
  return {
    num: line.num,
    home,
    away,
    day: DAY_MAP[line.day],
    hour,
    minute,
    field: normalizeField(line.field),
    matchType: line.matchType ?? inferMatchType(line.division, home, away),
    status: 'SCHEDULED',
  };
}

function inferMatchType(division: string, home: string, away: string): string {
  const d = division.toUpperCase();
  const text = `${home} ${away}`.toUpperCase();
  if (text.includes('FINAL') || d.includes('FINAL')) return 'Final';
  if (text.includes('SEMIFINAL') || d.includes('SEMIFINAL')) return 'Semi-final';
  if (text.includes('QUARTER') || d.includes('QUARTER')) return 'Quarter-final';
  if (d.includes('POOL')) return division.match(/POOL\s+[A-D]/i)?.[0] ?? 'Pool play';
  return 'Pool play';
}

export function slugifyDivision(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function inferGender(division: string): 'MALE' | 'FEMALE' | 'MIXED' {
  const d = division.toUpperCase();
  if (d.includes('GIRLS') || d.includes('WOMENS') || d.startsWith('G ')) return 'FEMALE';
  if (d.includes('REC')) return 'MIXED';
  return 'MALE';
}

export function inferAgeGroup(division: string): string {
  const d = division.toUpperCase();
  const uMatch = d.match(/\bU(\d+)\b/);
  if (uMatch) return `U${uMatch[1]}`;
  if (d.includes('OVER 45') || d.includes('O/45')) return '45+';
  if (d.includes('OVER 40') || d.includes('O/40') || d.includes('O40')) return '40+';
  if (d.includes('MENS') || d.includes('WOMENS')) return 'Adult';
  return 'Youth';
}

export function isScheduleOnly(division: string): boolean {
  const d = division.toUpperCase();
  if (d.includes('MENS PREM') || d.includes('MENS GOLD') || d.includes('MENS SILVER')) return false;
  if (d.includes('U13') && d.includes('BOYS')) return false; // U13-Open uses 10 point system per PDF
  // Mini youth divisions — participation medals only
  if (/\bU(5|6|7|8|9|10|11|12)\b/.test(d)) return true;
  if (d.includes('GIRLS')) return true;
  return false;
}

/**
 * True when a match slot is a bracket/pool placeholder ("Winner of Match 11",
 * "Pool A 1st", "1st Place", "TBD", …) rather than a registered team. These must
 * never be created as Team rows — they are stored as match labels instead.
 */
export function isPlaceholderTeam(name: string): boolean {
  return /^(winner of|loser of|pool\s+[a-d]\b|quarter\s*finals?\b|1st place|2nd place|finalist|tbd)\b/i.test(
    name.trim(),
  );
}

/** Registered teams only — placeholder slots are excluded. */
export function collectTeams(matches: ParsedMatch[]): string[] {
  const teams = new Set<string>();
  for (const m of matches) {
    if (!isPlaceholderTeam(m.home)) teams.add(m.home);
    if (!isPlaceholderTeam(m.away)) teams.add(m.away);
  }
  return [...teams].sort((a, b) => a.localeCompare(b));
}

export interface ValidationIssue {
  level: 'error' | 'warn';
  message: string;
}

export function validateDivision(
  slug: string,
  teams: string[],
  matches: ParsedMatch[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const teamSet = new Set(teams.map((t) => t.toLowerCase()));

  for (const m of matches) {
    if (!isPlaceholderTeam(m.home) && !teamSet.has(m.home.toLowerCase())) {
      issues.push({ level: 'error', message: `${slug} match ${m.num}: home "${m.home}" not in teams` });
    }
    if (!isPlaceholderTeam(m.away) && !teamSet.has(m.away.toLowerCase())) {
      issues.push({ level: 'error', message: `${slug} match ${m.num}: away "${m.away}" not in teams` });
    }
  }

  const nums = matches.map((m) => m.num);
  const dupNums = nums.filter((n, i) => nums.indexOf(n) !== i);
  if (dupNums.length) {
    issues.push({ level: 'warn', message: `${slug}: duplicate match numbers: ${[...new Set(dupNums)].join(', ')}` });
  }

  if (teams.length > 16) {
    const placeholders = teams.filter((t) =>
      /winner|loser|pool|quarter|1st place|2nd place|finalist/i.test(t),
    );
    if (teams.length - placeholders.length <= 16) {
      // Bracket placeholder teams inflate roster count — expected for knockout formats.
    } else {
      issues.push({ level: 'warn', message: `${slug}: ${teams.length} teams exceeds 16-team division cap` });
    }
  }

  return issues;
}
