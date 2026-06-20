import type {
  TournamentConfig,
  TournamentFormat,
  TournamentPhase,
} from './types';

/**
 * Ordered phases a tournament moves through for a given format. The engine
 * stays format-agnostic: callers ask which phases apply and drive standings
 * (round robin) and/or bracket resolution (knockout) accordingly.
 */
export function phasesForFormat(format: TournamentFormat): TournamentPhase[] {
  switch (format) {
    case 'ROUND_ROBIN':
      return ['ROUND_ROBIN'];
    case 'KNOCKOUT':
      return ['KNOCKOUT'];
    case 'ROUND_ROBIN_THEN_KNOCKOUT':
      return ['ROUND_ROBIN', 'KNOCKOUT'];
    default:
      return [];
  }
}

export function hasRoundRobin(config: TournamentConfig): boolean {
  return phasesForFormat(config.format).includes('ROUND_ROBIN');
}

export function hasKnockout(config: TournamentConfig): boolean {
  return phasesForFormat(config.format).includes('KNOCKOUT');
}
