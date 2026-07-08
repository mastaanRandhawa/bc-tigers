import type { EligibleTeam, TeamExclusion, ValidationReport } from './types';
import {
  MAX_SUPPORTED_TEAMS,
  VALID_BRACKET_SIZES,
  bracketSizeForTeamCount,
  byeCountForTeamCount,
  isValidBracketSize,
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
  bracketSize?: number;
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

  const autoSize = bracketSizeForTeamCount(eligible.length);
  const bracketSize =
    input.bracketSize != null ? input.bracketSize : autoSize;

  if (input.bracketSize != null && !isValidBracketSize(input.bracketSize)) {
    errors.push(
      `Bracket size must be one of ${VALID_BRACKET_SIZES.join(', ')}`,
    );
  }

  if (eligible.length > 0 && bracketSize < eligible.length) {
    errors.push(
      `Need at least ${eligible.length} bracket slots for ${eligible.length} teams (selected size: ${bracketSize})`,
    );
  }

  const byes = Math.max(0, bracketSize - eligible.length);
  if (byes > 0) {
    warnings.push(
      `${byes} empty slot${byes > 1 ? 's' : ''} in this ${bracketSize}-team bracket — place teams manually or use Random draw.`,
    );
  } else if (input.bracketSize != null && input.bracketSize > eligible.length) {
    warnings.push(
      `${input.bracketSize - eligible.length} extra empty slot${input.bracketSize - eligible.length > 1 ? 's' : ''} — fill manually or leave as BYEs.`,
    );
  }

  if (eligible.length > 0 && input.bracketSize == null) {
    const autoByes = byeCountForTeamCount(eligible.length);
    if (autoByes > 0) {
      warnings.push(
        `${autoByes} BYE${autoByes > 1 ? 's' : ''} may apply (${eligible.length} teams → ${autoSize}-team bracket). Place teams manually or use Random draw.`,
      );
    }
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
