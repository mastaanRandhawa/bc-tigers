import type { Prisma } from '@prisma/client';

export const BRACKET_NODE_INCLUDE = {
  home_team: true,
  away_team: true,
  winner: true,
  match: { include: { home_team: true, away_team: true } },
} as const;

export type BracketNodeDetail = Prisma.BracketNodeGetPayload<{
  include: typeof BRACKET_NODE_INCLUDE;
}>;
