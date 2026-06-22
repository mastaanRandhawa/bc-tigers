import type { EligibleTeam, TeamExclusion, ValidationReport } from './types';
import {
  MAX_SUPPORTED_TEAMS,
  bracketSizeForTeamCount,
  byeCountForTeamCount,
} from './bye-calculator';

export interface EligibilityInput {
  divisionId: string;
  teams: Array<{
    id: string;
    name: string;
    slug: string;
    division_id: string;
    players?: Array<{ active?: boolean }>;
  }>;
  minPlayersPerTeam?: number;
  locked?: boolean;
}

export function validateBracketGeneration(
  input: EligibilityInput,
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const excluded: TeamExclusion[] = [];
  const minPlayers = input.minPlayersPerTeam ?? 0;

  if (input.locked) {
    errors.push('Bracket is locked — unlock or reset before regenerating');
  }

  const eligible: EligibleTeam[] = [];

  for (const team of input.teams) {
    if (team.division_id !== input.divisionId) {
      excluded.push({
        teamId: team.id,
        teamName: team.name,
        reason: 'Team does not belong to this division',
      });
      continue;
    }

    const activePlayers =
      team.players?.filter((p) => p.active !== false).length ?? 0;
    if (minPlayers > 0 && activePlayers < minPlayers) {
      excluded.push({
        teamId: team.id,
        teamName: team.name,
        reason: `Insufficient roster (${activePlayers}/${minPlayers} players)`,
      });
      continue;
    }

    if (activePlayers === 0) {
      warnings.push(`${team.name} has no active players on roster`);
    }

    eligible.push({
      id: team.id,
      name: team.name,
      slug: team.slug,
      division_id: team.division_id,
      playerCount: activePlayers,
    });
  }

  if (eligible.length < 2) {
    errors.push(`Need at least 2 eligible teams (found ${eligible.length})`);
  }

  if (eligible.length > MAX_SUPPORTED_TEAMS) {
    errors.push(
      `This division has ${eligible.length} teams; single elimination supports up to ${MAX_SUPPORTED_TEAMS} per bracket. Split into pools or reduce teams.`,
    );
  }

  const bracketSize = bracketSizeForTeamCount(eligible.length);
  const byes = byeCountForTeamCount(eligible.length);
  if (byes > 0) {
    warnings.push(
      `${byes} BYE${byes > 1 ? 's' : ''} may apply (${eligible.length} teams → ${bracketSize}-team bracket). Place teams manually or use Random draw.`,
    );
  }

  if (eligible.length > 0) {
    warnings.push(
      'Bracket is created empty — drag teams into slots or use Random draw to shuffle.',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    excluded,
    eligibleCount: eligible.length,
  };
}

export function selectEligibleTeams(input: EligibilityInput): {
  eligible: EligibleTeam[];
  validation: ValidationReport;
} {
  const validation = validateBracketGeneration(input);
  const minPlayers = input.minPlayersPerTeam ?? 0;

  const eligible: EligibleTeam[] = input.teams
    .filter((team) => team.division_id === input.divisionId)
    .map((team) => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      division_id: team.division_id,
      playerCount: team.players?.filter((p) => p.active !== false).length ?? 0,
    }))
    .filter((t) => minPlayers === 0 || t.playerCount >= minPlayers);

  return { eligible, validation };
}
