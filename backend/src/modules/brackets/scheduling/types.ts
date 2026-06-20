import type { BracketStage } from '@prisma/client';

export type BracketSeeding = 'standard' | 'random' | 'manual' | 'alphabetical';

export interface EligibleTeam {
  id: string;
  name: string;
  slug: string;
  division_id: string;
  playerCount: number;
}

export interface TeamExclusion {
  teamId: string;
  teamName: string;
  reason: string;
}

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  excluded: TeamExclusion[];
  eligibleCount: number;
}

export interface FirstRoundSlot {
  position: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSeed: number;
  awaySeed: number;
  isBye: boolean;
}

export interface BracketPlan {
  divisionId: string;
  teamCount: number;
  bracketSize: number;
  byeCount: number;
  seeding: BracketSeeding;
  firstStage: BracketStage;
  stages: BracketStage[];
  firstRound: FirstRoundSlot[];
  validation: ValidationReport;
}

export interface BracketNodeDraft {
  division_id: string;
  stage: BracketStage;
  position: number;
  home_team_id?: string;
  away_team_id?: string;
}
