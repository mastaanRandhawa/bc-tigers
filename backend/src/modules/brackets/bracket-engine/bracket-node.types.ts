import type { Prisma } from '@prisma/client';

export const BRACKET_NODE_INCLUDE = {
  home_team: true,
  away_team: true,
  winner: true,
  match: {
    include: {
      home_team: true,
      away_team: true,
      home_source: { select: { round: true } },
      away_source: { select: { round: true } },
      home_source_group: { select: { name: true } },
      away_source_group: { select: { name: true } },
    },
  },
} as const;

export type BracketNodeDetail = Prisma.BracketNodeGetPayload<{
  include: typeof BRACKET_NODE_INCLUDE;
}>;
